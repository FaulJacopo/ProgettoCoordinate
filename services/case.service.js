const log = require('../utility/logger')
const { Case } = require('../models/case.model')

exports.createCase = async (title, reference, analyst) => {
    try {
        log.Info(`[CASE SERVICE] - Received request to create case with title: ${title} - Analyst: ${analyst}`)
    
        let created_case = await Case.create({ title, reference, analyst })
        await created_case.save()

        return { title: created_case.title, reference: created_case.reference, analyst: created_case.analyst, url: created_case.url }

    } catch (error) {
        log.Error(`[CASE SERVICE] - Something went wrong creating case: ${error}`)
        return false
    }
}

exports.getCases = async () => {
    try {
        log.Info(`[CASE SERVICE] - Received request to get all the cases in the database`)
    
        let cases = await Case.findAll()
        let cases_array = []
    
        cases.forEach(element => {
            cases_array.push({ id: element.id, title: element.title, reference: element.reference, analyst: element.analyst, url: element.url })
        })
    
        return cases_array

    } catch (error) {
        log.Error(`[CASE SERVICE] - Something went wrong getting cases: ${error}`)
        return false
    }
}

exports.getCaseById = async (case_id) => {
    try {
        log.Info(`[CASE SERVICE] - Received request to get the case from the database with ID: ${case_id}`)
    
        let sel_case = await Case.findByPk(parseInt(case_id))
        let sel_case_json = { title: sel_case.title, reference: sel_case.reference, analyst: sel_case.analyst, url: sel_case.url}
    
        return sel_case_json
    } catch (error) {
        log.Error(`[CASE SERVICE] - Something went wrong getting case by id: ${error}`)
        return false
    }
}

exports.getCaseByUrl = async (url) => {
    try {
        log.Info(`[CASE SERVICE] - Received request to get the case from the database with URL: ${url}`)
    
        let sel_case = await Case.findOne({ where: { url } })
        let sel_case_json = { id: sel_case.id, title: sel_case.title, reference: sel_case.reference, analyst: sel_case.analyst, url: sel_case.url}
    
        return sel_case_json
    } catch (error) {
        log.Error(`[CASE SERVICE] - Something went wrong getting case by url: ${error}`)
        return false
    }
}

exports.updateCase = async (case_id, title, reference, analyst) => {
    try {
        log.Info(`[CASE SERVICE] - Received request to update the case from the database with ID: ${case_id}`)

        let sel_case = await Case.findByPk(parseInt(case_id))

        // Updating
        sel_case.title = title
        sel_case.reference = reference
        sel_case.analyst = analyst
        
        if (await sel_case.save())
            return this.getCases()
        
    } catch (error) {
        log.Error(`[CASE SERVICE] - Something went wrong updating case: ${error}`)
        return false
    }
}

exports.deleteCase = async (case_id) => {
    try {
        log.Info(`[CASE SERVICE] - Received request to delete the case from the database with ID: ${case_id}`)
    
        let deleted_case = await Case.destroy({ id: case_id })
        return this.getCases()
    } catch (error) {
        log.Error(`[CASE SERVICE] - Something went wrong deleting case: ${error}`)
        return false
    }
}