const Router = require('@koa/router');
const router = new Router();
const { query } = require('../db-postgres');
require('dotenv').config();

/* 
################## getTasksToModerate ########################
*/
router.get('/getTasksToModerate', async (ctx, next) => {
    if (ctx.request.path === '/getTasksToModerate') {
        console.log("'/getTasksToModerate' " + new Date());

        try {
            // Find tasks that have unmoderated videos
            const sql = "SELECT DISTINCT task_id FROM participant_videos WHERE moderated = 'null'";
            const res = await query(sql);
            const taskIds = res.rows.map(r => r.task_id);

            // Note: In the original version, we fetched full task details from chain.
            // Since we don't have the Solana program connection here yet, 
            // and we haven't indexed tasks to a 'tasks' table yet,
            // we return the IDs. The frontend will need to fetch task details or we need to add a tasks table.
            // If we had a tasks table: SELECT * FROM tasks WHERE id IN (taskIds)...

            ctx.body = {
                message: 'list of taskIds with videos to be moderated',
                data: taskIds.map(id => ({ tokenId: id.toString() })) // Mocking structure slightly
            };

        } catch (error) {
            console.error("Error fetching tasks to moderate:", error);
            ctx.throw(500, error);
        }
    }
    await next();
});


/* 
########################## reminder ###########################
*/
router.post('/reminder', async (ctx, next) => {
    if (ctx.request.path === '/reminder') {
        const { tokenId, participantAddress } = ctx.request.body;

        try {
            // Upsert reminder
            // Check if exists
            const checkSql = 'SELECT * FROM moderation_reminders WHERE task_id = $1 AND participant_address = $2';
            const checkRes = await query(checkSql, [tokenId, participantAddress]);

            if (checkRes.rows.length > 0) {
                await query('UPDATE moderation_reminders SET reminder_count = reminder_count + 1 WHERE task_id = $1 AND participant_address = $2', [tokenId, participantAddress]);
            } else {
                await query('INSERT INTO moderation_reminders (task_id, participant_address, reminder_count) VALUES ($1, $2, 1)', [tokenId, participantAddress]);
            }

            ctx.body = {
                message: 'Reminder inserted/updated successfully.'
            };

        } catch (error) {
            ctx.throw(500, 'Failed to insert/update reminder.', error);
        }
    }
    await next();
});

module.exports = router;
