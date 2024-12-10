from flask import render_template, Blueprint, request
from CTFd.models import db, Users, Challenges, Solves, UserFields, UserFieldEntries
from CTFd.plugins.scheduled_challenges import ScheduledChallenges
from pathlib import Path
from CTFd.utils.decorators import admins_only
from CTFd.utils.countries import COUNTRIES_LIST
from datetime import datetime
from sqlalchemy import func

class CandidateConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type_config = db.Column(db.Enum('domain','country'))
    value = db.Column(db.String(100))

    def __init__(self, type_config, value):
        self.type_config = type_config
        self.value = value


def load(app):
    app.db.create_all()
    get_candidates_blueprint = Blueprint('get_candidates', __name__, template_folder='templates')

    @get_candidates_blueprint.route('/admin/candidates', methods=['GET'])
    @admins_only
    def candidates():
        countries = CandidateConfig.query.filter_by(type_config='country').all()
        domains = CandidateConfig.query.filter_by(type_config='domain').all()
        return render_template('get_candidates.html', countries=countries, domains=domains, countries_list=COUNTRIES_LIST)
    
    @get_candidates_blueprint.route('/admin/candidates', methods=['POST'])
    @admins_only
    def retrieve_candidates():
        data = request.get_json()
        first_day = datetime.fromisoformat(data['first_day']+"T00:00:00")
        last_day = datetime.fromisoformat(data['last_day']+"T23:59:59")
        
        stmt_challs = db.select(ScheduledChallenges.id).where(ScheduledChallenges.activation_date >= first_day).where(ScheduledChallenges.activation_date <= last_day)

        stmt_solves = db.select(func.count(), Solves.user_id).select_from(Solves).where(Solves.date >= first_day)
        stmt_solves= stmt_solves.where(Solves.date <= last_day).where(Solves.challenge_id.in_(stmt_challs)).group_by(Solves.user_id)
        subq_solves = stmt_solves.subquery()

        stmt_country = db.select(CandidateConfig.value).select_from(CandidateConfig).where(CandidateConfig.type_config == 'country')
        stmt_domain = db.select(CandidateConfig.value).select_from(CandidateConfig).where(CandidateConfig.type_config == 'domain')
        subq_domain = stmt_domain.subquery()

        stmt_users = db.select(Users, subq_solves.c.count).join(UserFieldEntries, Users.field_entries).join(UserFields, UserFieldEntries.field)
        stmt_users = stmt_users.where(UserFields.name=="Gift").where(UserFieldEntries.value=="true")
        stmt_users = stmt_users.where(Users.country.in_(stmt_country))
        stmt_users = stmt_users.where(Users.email.endswith(func.concat('@',subq_domain.c.value)))
        stmt_users = stmt_users.join(subq_solves, Users.id == subq_solves.c.user_id)

        # we execute the request
        results = db.session.execute(stmt_users).unique().fetchall()
        return {"success": True,
                 "data": [{"id": r[0].id, "email": r[0].email, "country":r[0].country, "count":r[1]} for r in results]}

    
    @get_candidates_blueprint.route('/admin/candidates/country', methods=['POST'])
    @admins_only
    def add_country():
        data = request.get_json()
        if data['country'] not in [c[0] for c in COUNTRIES_LIST]:
            return {"success": False, "message": "Invalid country"}
        if CandidateConfig.query.filter_by(value=data['country']).first():
            return {"success": False, "message": "Country already exists"}
        dbcountry = CandidateConfig('country',data['country'])
        db.session.add(dbcountry)
        db.session.commit()
        return {"success": True}
    
    @get_candidates_blueprint.route('/admin/candidates/domain', methods=['POST'])
    @admins_only
    def add_domain():
        data = request.get_json()
        if CandidateConfig.query.filter_by(value=data['domain']).first():
            return {"success": False, "message": "Domain already exists"}
        dbdomain = CandidateConfig('domain', data['domain'])
        db.session.add(dbdomain)
        db.session.commit()
        return {"success": True}
    
    @get_candidates_blueprint.route('/admin/candidates/country/<int:id>', methods=['DELETE'])
    @admins_only
    def delete_country(id):
        country = CandidateConfig.query.filter_by(id=id).first()
        if country is None:
            return {"success": False, "message": "Country not found"}
        db.session.delete(country)
        db.session.commit()
        return {"success": True}
    
    @get_candidates_blueprint.route('/admin/candidates/domain/<int:id>', methods=['DELETE'])
    @admins_only
    def delete_domain(id):
        domain = CandidateConfig.query.filter_by(id=id).first()
        if domain is None:
            return {"success": False, "message": "Domain not found"}
        db.session.delete(domain)
        db.session.commit()
        return {"success": True}
    
    @get_candidates_blueprint.route('/admin/candidates/country', methods=['GET'])
    @admins_only
    def get_countries():
        countries = CandidateConfig.query.filter_by(type_config='country').all()
        return {
            "success": True, 
            "data":[{'id':c.id, 'value':[country[1] for country in COUNTRIES_LIST if c.value==country[0]]} for c in countries]
            }
    
    @get_candidates_blueprint.route('/admin/candidates/domain', methods=['GET'])
    @admins_only
    def get_domains():
        domains = CandidateConfig.query.filter_by(type_config='domain').all()
        return {"success": True, "data":[{'id':d.id, 'value':d.value} for d in domains]}
    
    app.register_blueprint(get_candidates_blueprint)