// A discord bot to show eden network stats:
//   - stats includes hashrate, staker count, staked token count
//   - set nickname of bot to display data
//   - send http request to fetch data: https://explorer.edennetwork.io
//
// Script accepts two environment variabless as input:
//   - TOKEN : discord bot token to authorize this bot
//   - GUILD_ID : server guild id

const jsdom = require("jsdom");
const axios = require('axios');
const { Client, Intents } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] })

// welcome msg after bot login
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
});


async function fetch_data() {
    const response = await axios.get('https://explorer.edennetwork.io/');

    // parse html to get stats
    const dom = new jsdom.JSDOM(response.data);
    let content = dom.window.document.querySelector("#__NEXT_DATA__").textContent;
    let obj = JSON.parse(content);

    return {
        'hash': obj.props.pageProps.hashRate,
        'stakers': obj.props.pageProps.stakers,
        'staked': obj.props.pageProps.staked
    }
}


function format_data(data) {
    let hash = `${data.hash.toFixed(0)}%`;
    let stakers = `${(data.stakers / 1000).toFixed(1)}k`;
    let staked = `${(data.staked / 1e6).toFixed(1)}m`
    return hash + ' | ' + stakers + ' | ' + staked
}


async function update_bot_name_to_stats( )
{
    try {
        // fetch and format stats
        let stats = await fetch_data();
        let formatted_stats = format_data(stats);

        // update bot nick name to stats
        let guild = client.guilds.cache.get(process.env.GUILD_ID);
        let member = await guild.members.fetch(client.user);
        await member.setNickname(formatted_stats);

        console.log(`${new Date().toISOString()} updated nickname to ${formatted_stats}`);

    } catch (error) {
        console.error(error)
    }
}

// update every 20 seconds
setInterval(update_bot_name_to_stats, 20000);

// discord bot login
client.login(process.env.TOKEN);
