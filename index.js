const express = require('express');
const app = express();
const server = require('http').createServer(app);
const cheerio = require('cheerio');
const { default: axios } = require('axios');

let concurrentRequestsRunning = 0;

app.use(express.static('public'));

app.get("/scrape", async (req, res) => {
    let url = req.query["url"]

    if (url == undefined || url == null) {
        console.log("Invalid Request:", req.query["url"])
        res.status(400).send("No url provided");
        return;
    }

    let data = []

    while (concurrentRequestsRunning >= 10) {}

    concurrentRequestsRunning++;

    try {
        let site = await (await axios.get(url)).data

        const $ = cheerio.load(site)

        $('a[href]').each((i, elem) => {
            let obj = $(elem)
            data.push(obj.attr("href").split("?")[0].replace("https://www.", "https://").replace("http://www.", "http://"))
        })

        res.send({
            parent: url,
            data: data
        })
    } catch (e) {
        res.status(500).send(e)
    }

    concurrentRequestsRunning--;
})

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
