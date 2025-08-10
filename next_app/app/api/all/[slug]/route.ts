import { NextResponse } from 'next/server'
const scrap1337x = require('./torrent/1337x');
const scrapNyaa = require('./torrent/nyaaSI');
const scrapYts = require('./torrent/yts');
const scrapPirateBay = require('./torrent/pirateBay');
const scrapTorLock = require('./torrent/torLock');
const scrapEzTVio = require('./torrent/ezTV');
const torrentGalaxy = require('./torrent/torrentGalaxy');
const rarbg = require('./torrent/rarbg');
const ettvCentral = require('./torrent/ettv');
const zooqle = require('./torrent/zooqle');
const kickAss = require('./torrent/kickAss');
const bitSearch = require('./torrent/bitSearch');
const glodls = require('./torrent/gloTorrents');
const magnet_dl = require('./torrent/magnet_dl');
const limeTorrent = require('./torrent/limeTorrent');
const torrentFunk = require('./torrent/torrentFunk');
const torrentProject = require('./torrent/torrentProject');
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const data = await combo(slug);
  console.log(data)
  return NextResponse.json({ data })
}

async function combo(query: any, page? : Number | undefined) {
    let comboTorrent: any[] = [], timeout = 10000 //wait time before rejecting promised results
    await Promise.allSettled([

        // Promise.race([new Promise((_, reject) => (
        //     setTimeout(() => {
        //         reject({code: 408, message: 'Timeout exceeded'})
        //     }, timeout))),
        //     new Promise((resolve, _) => resolve(scrap1337x.torrent1337x(query, page)))
        // ]),
        Promise.race([new Promise((_, reject) => (
            setTimeout(() => {
                reject({code: 408, message: 'Timeout exceeded'})
            }, timeout))),
            new Promise((resolve, _) => resolve(scrapYts.yts('query', 1)))
        ]),
        // Promise.race([new Promise((_, reject) => (
        //     setTimeout(() => {
        //         reject({code: 408, message: 'Timeout exceeded'})
        //     }, timeout))),
        //     new Promise((resolve, _) => resolve(limeTorrent(query, page)))
        // ]),
        // Promise.race([new Promise((_, reject) => (
        //     setTimeout(() => {
        //         reject({code: 408, message: 'Timeout exceeded'})
        //     }, timeout))),
        //     new Promise((resolve, _) => resolve(torrentGalaxy(query, page)))
        // ]),
        // Promise.race([new Promise((_, reject) => (
        //     setTimeout(() => {
        //         reject({code: 408, message: 'Timeout exceeded'})
        //     }, timeout))),
        //     new Promise((resolve, _) => resolve(rarbg(query, page)))
        // ]),
        // Promise.race([new Promise((_, reject) => (
        //     setTimeout(() => {
        //         reject({code: 408, message: 'Timeout exceeded'})
        //     }, timeout))),
        //     new Promise((resolve, _) => resolve(zooqle.zooqle(query, page)))
        // ]),
        // Promise.race([new Promise((_, reject) => (
        //     setTimeout(() => {
        //         reject({code: 408, message: 'Timeout exceeded'})
        //     }, timeout))),
        //     new Promise((resolve, _) => resolve(kickAss(query, page)))
        // ]),
        // Promise.race([new Promise((_, reject) => (
        //     setTimeout(() => {
        //         reject({code: 408, message: 'Timeout exceeded'})
        //     }, timeout))),
        //     new Promise((resolve, _) => resolve(scrapTorLock.torLock(query, page)))
        // ]),
        // Promise.race([new Promise((_, reject) => (
        //     setTimeout(() => {
        //         reject({code: 408, message: 'Timeout exceeded'})
        //     }, timeout))),
        //     new Promise((resolve, _) => resolve(scrapNyaa.nyaaSI(query, page)))
        // ]),
        // Promise.race([new Promise((_, reject) => (
        //     setTimeout(() => {
        //         reject({code: 408, message: 'Timeout exceeded'})
        //     }, timeout))),
        //     new Promise((resolve, _) => resolve(bitSearch(query, page)))
        // ]),
        // Promise.race([new Promise((_, reject) => (
        //     setTimeout(() => {
        //         reject({code: 408, message: 'Timeout exceeded'})
        //     }, timeout))),
        //     new Promise((resolve, _) => resolve(scrapEzTVio.ezTV(query)))
        // ]),
        // Promise.race([new Promise((_, reject) => (
        //     setTimeout(() => {
        //         reject({code: 408, message: 'Timeout exceeded'})
        //     }, timeout))),
        //     new Promise((resolve, _) => resolve(scrapPirateBay.pirateBay(query, page)))
        // ]),
        // Promise.race([new Promise((_, reject) => (
        //     setTimeout(() => {
        //         reject({code: 408, message: 'Timeout exceeded'})
        //     }, timeout))),
        //     new Promise((resolve, _) => resolve(magnet_dl(query, page)))
        // ]),
        // Promise.race([new Promise((_, reject) => (
        //     setTimeout(() => {
        //         reject({code: 408, message: 'Timeout exceeded'})
        //     }, timeout))),
        //     new Promise((resolve, _) => resolve(torrentFunk(query, page)))
        // ]),
        // Promise.race([new Promise((_, reject) => (
        //     setTimeout(() => {
        //         reject({code: 408, message: 'Timeout exceeded'})
        //     }, timeout))),
        //     new Promise((resolve, _) => resolve(glodls(query, page)))
        // ]),
        Promise.race([new Promise((_, reject) => (
            setTimeout(() => {
                reject({code: 408, message: 'Timeout exceeded'})
            }, timeout))),
            new Promise((resolve, _) => resolve(torrentProject(query, page)))
        ])])
        .then((comboResult) => {
            comboTorrent = (comboResult.filter((element) =>
                element.status === 'fulfilled' && element.value && element.value.length > 0)).map((element) => {
                return element;
                // return element.value

            })
        })
        .catch(err => console.log(err))

    return comboTorrent;
}