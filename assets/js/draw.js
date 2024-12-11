async function addCountry() {
    const country = document.getElementById('new_country').value;
    const url = '/admin/candidates/country';
    const data = { country: country };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'CSRF-Token': init.csrfNonce,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            document.getElementById('new_country').value = '';
            reloadCountries();
        } else {
            console.log(result);
        }
    } catch (error) {
        console.log(error);
        document.getElementById('new_country').value = '';
        reloadCountries();
    }
}

async function reloadCountries() {
    const url = '/admin/candidates/country';
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const result = await response.json();
        const allowed_country = document.getElementById('allowed_country');
        allowed_country.innerHTML = '';
        result.data.forEach(country => {
            const div = document.createElement('div');
            const span = document.createElement('span');
            span.innerHTML = country.value;
            const a = document.createElement('a');
            a.innerHTML = 'x';
            a.className = "btn-fa delete-tag"
            a.onclick = () => removeCountry(country.id);
            div.appendChild(span);
            div.appendChild(document.createTextNode(' '));
            div.appendChild(a);
            allowed_country.appendChild(div);
        });
    } catch (error) {
        console.log(error);
    }
}

async function removeCountry(id) {
    const url = '/admin/candidates/country/' + id;
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'CSRF-Token': init.csrfNonce,
                'Content-Type': 'application/json',
            }
        });
        const result = await response.json();
        if (result.success) {
            reloadCountries();
        }
    } catch (error) {
        console.log(error);
        reloadCountries();
    }
}

function domainNewKey(event) {
    if (event.keyCode === 13) {
        addDomain();
    }
}

async function addDomain() {
    const domain = document.getElementById('domain').value;
    const url = '/admin/candidates/domain';
    const data = { domain: domain };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'CSRF-Token': init.csrfNonce,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            document.getElementById('domain').value = '';
            reloadDomains();
        } else {
            console.log(result);
        }
    } catch (error) {
        console.log(error);
        document.getElementById('domain').value = '';
        reloadDomains();
    }
}

async function reloadDomains() {
    const url = '/admin/candidates/domain';
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const result = await response.json();
        const allowed_email_domains = document.getElementById('allowed_email_domains');
        allowed_email_domains.innerHTML = '';
        result.data.forEach(domain => {
            const div = document.createElement('div');
            const span = document.createElement('span');
            span.innerText = domain.value;
            const a = document.createElement('a');
            a.innerText = 'x';
            a.className = "btn-fa delete-tag"
            a.onclick = () => removeDomain(domain.id);
            div.appendChild(span);
            div.appendChild(document.createTextNode(' '));
            div.appendChild(a);
            allowed_email_domains.appendChild(div);
        });
    } catch (error) {
        console.log(error);
    }
}

async function removeDomain(id) {
    const url = '/admin/candidates/domain/' + id;
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'CSRF-Token': init.csrfNonce,
                'Content-Type': 'application/json',
            }
        });
        const result = await response.json();
        if (result.success) {
            reloadDomains();
        }
    } catch (error) {
        console.log(error);
        reloadDomains();
    }
}

async function retrieveCandidates() {
    const form = document.getElementById('form_get_candidates');
    if (!form.reportValidity()) {
        return false;
    }
    const first_day = document.getElementById('first_day').value;
    const last_day = document.getElementById('last_day').value;
    const url = '/admin/candidates';
    const data = { first_day: first_day, last_day: last_day };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'CSRF-Token': init.csrfNonce,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            displayTable(result.data, 'display_candidates', 'candidates.csv');
        } else {
            console.log(result);
        }
    } catch (error) {
        console.log(error);
    }
}

function draw() {
    const form = document.getElementById('form_draws');
    if (!form.reportValidity()) {
        return false;
    }
    var first_day = document.getElementById('draw_first_day').value;
    var last_day = document.getElementById('draw_last_day').value;
    var nb_winners = document.getElementById('draws_nb_winners').value;
    var min_solves = document.getElementById('draws_min_solves').value;
    var max_solves = document.getElementById('draws_max_solves').value;
    var url = '/admin/draws';
    var data = {
        first_day: first_day,
        last_day: last_day,
        nb_winners: nb_winners,
        min_solves: min_solves,
        max_solves: max_solves
    };
    fetch(url, {
        method: 'POST',
        headers: {
            'CSRF-Token': init.csrfNonce,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    }).then(response => {
        if (response.ok) {
            return response.json();
        }
    }).then(data => {
        if (data.success) {
            displayTable(data.data, 'display_winners', 'winners.csv');
        } else {
            console.log(data);
        }
    }).catch(error => {
        console.log(error);
    });
}

function displayTable(data, elementId, fileName) {
    var displayElement = document.getElementById(elementId);
    displayElement.innerHTML = '';
    var table = document.createElement('table');
    table.className = 'table table-stripped border';
    var thead = document.createElement('thead');
    var tr = document.createElement('tr');
    ['Id', 'Email', 'Country', 'Valid solves'].forEach(header => {
        var th = document.createElement('th');
        th.className = "sort-col text-center";
        th.innerText = header;
        tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);
    var tbody = document.createElement('tbody');
    data.forEach(candidate => {
        var tr = document.createElement('tr');
        ['id', 'email', 'country', 'count'].forEach(key => {
            var td = document.createElement('td');
            td.className = "text-center";
            td.innerText = candidate[key];
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    displayElement.appendChild(table);
    var downloadButton = document.getElementById(elementId === 'display_candidates' ? 'download_candidates' : 'download_draw');
    downloadButton.onclick = function() {
        var csv = 'Id,Email,Country,Valid solves\n';
        data.forEach(candidate => {
            csv += candidate.id + ',' + candidate.email + ',' + candidate.country + ',' + candidate.count + '\n';
        });
        var blob = new Blob([csv], {type: 'text/csv'});
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
    downloadButton.style.display = 'block';
}
