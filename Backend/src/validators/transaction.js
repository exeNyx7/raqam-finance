const { z } = require('zod')

const createTransactionSchema = z.object({
    body: z.object({
        description: z.string().min(1, 'Description is required').trim(),
        amount: z.number({ required_error: 'Amount is required' }),
        category: z.string().min(1, 'Category is required').trim(),
        date: z.string().or(z.date()).transform((val) => new Date(val)),
        ledgerId: z.string().optional(),
        type: z.enum(['income', 'expense']),
        status: z.enum(['pending', 'completed', 'cancelled']).optional().default('completed'),
        metadata: z.record(z.any()).optional(),
    }),
})

const updateTransactionSchema = z.object({
    body: z.object({
        description: z.string().min(1).trim().optional(),
        amount: z.number().optional(),
        category: z.string().min(1).trim().optional(),
        date: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
        ledgerId: z.string().optional(),
        type: z.enum(['income', 'expense']).optional(),
        status: z.enum(['pending', 'completed', 'cancelled']).optional(),
        metadata: z.record(z.any()).optional(),
    }),
    params: z.object({
        id: z.string().min(1, 'Transaction ID is required'),
    }),
})

module.exports = {
    createTransactionSchema,
    updateTransactionSchema,
}
