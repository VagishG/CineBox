import { LocalItem } from "@/next_app/data/local";

const FOLDER_PATH="/home/noobhacker/Videos/CineBox"

export async function downloadTorrent(item:LocalItem){
    const status= await window.fileAPI.download(item.Files[0].Magnet);

    console.log(status)
}