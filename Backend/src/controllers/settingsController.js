const Settings = require('../models/Settings')

async function getOrCreateSettings(userId) {
    let doc = await Settings.findOne({ userId })
    if (!doc) {
        doc = await Settings.create({ userId })
    }
    return doc
}

exports.getSettings = async (req, res, next) => {
    try {
        const settings = await getOrCreateSettings(req.userId)
        return res.json({ success: true, timestamp: new Date().toISOString(), data: settings.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.updateSettings = async (req, res, next) => {
    try {
        const allowed = ['currency', 'dateFormat', 'theme', 'notifications', 'privacy']
        const updates = {}
        for (const key of allowed) if (key in req.body) updates[key] = req.body[key]
        const updated = await Settings.findOneAndUpdate({ userId: req.userId }, updates, { new: true, upsert: true, setDefaultsOnInsert: true })
        return res.json({ success: true, timestamp: new Date().toISOString(), data: updated.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.listCategories = async (req, res, next) => {
    try {
        const settings = await getOrCreateSettings(req.userId)
        return res.json({ success: true, timestamp: new Date().toISOString(), data: settings.categories })
    } catch (err) {
        next(err)
    }
}

exports.addCategory = async (req, res, next) => {
    try {
        const { name } = req.body
        if (!name || !String(name).trim()) {
            return res.status(400).json({ success: false, message: 'Category name required', timestamp: new Date().toISOString() })
        }
        const settings = await getOrCreateSettings(req.userId)
        const exists = settings.categories.includes(name)
        if (!exists) settings.categories.push(name)
        await settings.save()
        return res.status(201).json({ success: true, timestamp: new Date().toISOString(), data: settings.categories })
    } catch (err) {
        next(err)
    }
}

exports.deleteCategory = async (req, res, next) => {
    try {
        const { name } = req.params
        const settings = await getOrCreateSettings(req.userId)
        settings.categories = settings.categories.filter((c) => c !== name)
        await settings.save()
        return res.json({ success: true, timestamp: new Date().toISOString(), data: settings.categories })
    } catch (err) {
        next(err)
    }
}


