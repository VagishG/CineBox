// document.getElementById('downloadBtn').addEventListener('click', async () => {
//   const magnet = document.getElementById('magnetLink').value
//   const fileName = document.getElementById('fileName').value || null

//   window.torrentAPI.onProgress(({ progress, downloaded, total }) => {
//     console.log(`Progress: ${progress}% (${downloaded}/${total} bytes)`)
//     // Update progress bar or UI here
//   })

//   const result = await window.torrentAPI.download(magnet, fileName)

//   if (result.success) {
//     alert(`Downloaded file saved at: ${result.filePath}`)
//   } else {
//     alert(`Error: ${result.error}`)
//   }
// })
