var CronJob = require('cron').CronJob;
const Table = require('../api/models/table');

// DAILY 2:30 AM , Removed unwanted tables
new CronJob('30 2 * * *', async function () {
  console.log("Cron Executed");
  // FIX_2407 : ALREADY PLAYING
  let tabs = await Table.deleteMany({ 'game_completed_at': '-1','created_at':{$lt:new Date().getTime() - 3600000}, $expr: { $ne: ["$no_of_players", { $size: "$players" }] } });
  console.log("remove",tabs);
}, null, true, 'Asia/Kolkata');
