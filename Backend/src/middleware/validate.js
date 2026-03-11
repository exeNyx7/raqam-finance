const { z } = require('zod')

const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        })
        // Replace request parts with parsed (and fully typed/coerced) data
        // Note: For partial validation (e.g. only body), schema should only define body
        if (parsed.body) req.body = parsed.body
        if (parsed.query) req.query = parsed.query
        if (parsed.params) req.params = parsed.params
        next()
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: err.errors.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message,
                })),
                timestamp: new Date().toISOString(),
            })
        }
        next(err)
    }
}

module.exports = validate
