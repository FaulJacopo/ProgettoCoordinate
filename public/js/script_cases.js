
function loadCases() {
    $.post('/cases/get-cases', {}, async function(res) {
        if (res.error) {
            showErrorNotification(res.error)
            window.location.href = res.redirect
        } else {
            let cases = JSON.parse(res.cases)
            let cases_content = ""

            cases.forEach((element, index) => {
                cases_content += `<li><a href="/cases/${element.url}" class="group flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6"><span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-sm font-bold text-red-700">${index + 1}</span><span class="min-w-0 flex-1"><span class="flex flex-wrap items-center gap-2"><span class="truncate font-semibold text-slate-900 group-hover:text-red-700">${element.title}</span></span><span class="mt-1 block truncate text-sm text-slate-500">Rif. ${element.reference} / ${element.analyst}</span></span><span class="hidden text-right sm:block"><span class="block text-xs font-medium text-slate-700">Aggiornato oggi</span><span class="mt-1 block text-xs text-slate-400">09:42</span></span><span class="text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-red-500" aria-hidden="true">&gt;</span></a></li>`
            });

            $('#cases-list').html(cases_content)
        }
    })
}

function addCase(form) {
    const title = form.title.value;
    const reference = form.reference.value;
    const analyst = form.analyst.value;

    if (title && analyst) {
        $.post('/cases/create-case', { title, reference, analyst }, async function(res) {
            if (res.error) {
                showErrorNotification(res.error)
                window.location.href = res.redirect
            } else {
                let received_case = JSON.parse(res.case)
                window.location.href = `/cases/${received_case.url}`
            }
        })
    } else {
        showErrorNotification('Please fill in the required fields.')
    }
}

$(document).ready(() => {
    loadCases()
})
