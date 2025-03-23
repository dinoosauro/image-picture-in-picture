(() => {

    /**
     * The collection of all the Images that the user has added.
     * It might contain "null" values if the image has been removed.
     * @type (HTMLImageElement | null)[]
    */
    const fileContainer = [];
    /**
     * The position in the fileContainer array of the item that is being used
     */
    let videoPlaybackId = 0;
    /**
     * If the video still hasn't been loaded (so, if it's the first time the user adds photos)
     */
    let videoShouldBeLoaded = true;
    /**
     * The width that should be used to fit the widest image. This is used if the user enables the "Use the same width/height ratio for all images".
     */
    let suggestedVideoWidth = 0;
    /**
     * The image ID that is being shown in the "Delete or block Image" dialog.
     */
    let selectedImageId = 0;
    /**
     * If the user has requested to keep a single image shown.
     */
    let isBlockedOnASingleImage = false;
    /**
     * The Video element that is used for Picture-in-Picture mode
     * @type HTMLVideoElement
    */
    const video = document.getElementById("video");
    document.getElementById("deleteImage").onclick = () => { // Remove the image that has been selected (and that is shown from the dialog)
        fileContainer[selectedImageId].remove();
        fileContainer[selectedImageId] = null;
        if (selectedImageId === videoPlaybackId) updateVideo();
        closeDialog(document.getElementById("selectedImgDialog"));
    }
    document.getElementById("blockOnThisImg").onclick = () => { // Show only the image that has been selected
        videoPlaybackId = selectedImageId;
        isBlockedOnASingleImage = false; // Disable it so that it's possible to change the image even if the user has previosuly blocked another image
        updateVideo();
        isBlockedOnASingleImage = true;
        document.getElementById("unblockContainer").style.display = "block";
        closeDialog(document.getElementById("selectedImgDialog"));
    }
    document.getElementById("closeImgDialog").onclick = () => closeDialog(document.getElementById("selectedImgDialog"));
    document.getElementById("unblockImg").onclick = () => { // Disable image blocking
        isBlockedOnASingleImage = false;
        document.getElementById("unblockContainer").style.display = "none";
    }

    /**
     * Load a new script in the webpage.
     * @param {string} type an identifier for this script
     * @param {string} url the URL where the script is fetched
     * @returns a Promise, resolved when the script is loaded.
     */
    function loadNewScript(type, url) {
        return new Promise((res) => {
            if (document.querySelector(`[data-script=${type}]`)) res(); else {
                const script = Object.assign(document.createElement("script"), {
                    src: url,
                    type: "module",
                    onload: res
                });
                script.setAttribute("data-script", type);
                document.body.append(script);
            }
        });
    }
    /**
     * Add an image to the list
     * @param {Blob} file a Blob that contains a valid Image. If the browser throws an error while decoding it, the image won't be added, but the Promise will still be resolved.
     */
    async function setupImage(file) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onclick = () => {
            selectedImageId = fileContainer.indexOf(img);
            openDialog(document.getElementById("selectedImgDialog"));
            document.getElementById("selectedImg").src = img.src;
        }
        if (await new Promise((res) => {
            img.onload = () => res(true);
            img.onerror = () => res(false);
        })) {
            fileContainer.push(img);
            document.getElementById("imgContainer").append(img);
        }


    }

    /**
     * Add more images to the ones that can go in Picture-in-Picture
     * @param {FileList} files 
     */
    async function updateFiles(files) {
        for (const file of files) {
            if (file.type.startsWith("image") && (file.type !== "image/heic" || !document.getElementById("heic2any").checked)) await setupImage(file); else if (file.type === "application/pdf") {
                await loadNewScript("pdf", "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.0.375/build/pdf.min.mjs");
                await loadNewScript("pdfworker", "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.0.375/build/pdf.worker.min.mjs");
                const pdfDocument = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
                for (let i = 0; i < pdfDocument.numPages; i++) {
                    const page = await pdfDocument.getPage(i + 1);
                    const viewport = page.getViewport({ scale: page.view[2] * 1080 / page.view[3] / page.view[2] });
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext('2d');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;
                    const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.9));
                    await setupImage(blob);
                }
            } else if (file.name.endsWith("heif") || file.name.endsWith("heic") || file.type === "image/heic") {
                await loadNewScript("heic", "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js");
                for (const image of await heic2any({ blob: file, multiple: true })) setupImage(image);
            }
        }
        suggestedVideoWidth = Math.max(...fileContainer.filter(item => !!item).map(item => item.naturalWidth * 1080 / item.naturalHeight));
    }
    document.getElementById("pick").onclick = () => { // Pick new files
        Object.assign(document.createElement("input"), {
            type: "file",
            onchange: async function (e) {
                await updateFiles(e.target.files);
                updateVideo();
            },
            multiple: true
        }).click();
    };
    /**
     * The Canvas that is used to draw all the images
     */
    const canvas = document.createElement("canvas");
    /**
     * Draw the selected image on a canvas
     */
    function updateVideo() {
        if (isBlockedOnASingleImage || fileContainer.length === 0 || (fileContainer.length === 1 && fileContainer[videoPlaybackId] && !videoShouldBeLoaded)) return;
        while (!fileContainer[videoPlaybackId]) videoPlaybackId = typeof fileContainer[videoPlaybackId] === "undefined" ? 0 : videoPlaybackId + 1; // If the item is undefined, it's outside the bounds of the array; if it's null, the item has been deleted; otherwise it's a valid image.
        canvas.width = document.getElementById("keepSameRatio").checked ? suggestedVideoWidth : (fileContainer[videoPlaybackId].naturalWidth * 1080 / fileContainer[videoPlaybackId].naturalHeight);
        canvas.height = 1080;
        if (videoShouldBeLoaded) {
            video.srcObject = canvas.captureStream();
            video.load();
            videoShouldBeLoaded = false;
        }
        const [widthProportion, heightProportion] = [fileContainer[videoPlaybackId].naturalWidth * 1080 / fileContainer[videoPlaybackId].naturalHeight, fileContainer[videoPlaybackId].naturalHeight * canvas.width / fileContainer[videoPlaybackId].naturalWidth]
        canvas.getContext("2d").drawImage(
            fileContainer[videoPlaybackId],
            (document.getElementById("keepSameRatio").checked && document.getElementById("sameAspectRatioPosition").value === "right" && fileContainer[videoPlaybackId].naturalHeight > fileContainer[videoPlaybackId].naturalWidth) ? Math.floor(canvas.width - widthProportion) : 0,
            (document.getElementById("keepSameRatio").checked && document.getElementById("sameAspectRatioPosition").value === "right" && fileContainer[videoPlaybackId].naturalWidth > fileContainer[videoPlaybackId].naturalHeight) ? Math.floor(canvas.height - heightProportion) : 0,
            (document.getElementById("keepSameRatio").checked && fileContainer[videoPlaybackId].naturalHeight > fileContainer[videoPlaybackId].naturalWidth) ? Math.floor(widthProportion) : canvas.width,
            (document.getElementById("keepSameRatio").checked && fileContainer[videoPlaybackId].naturalWidth > fileContainer[videoPlaybackId].naturalHeight) ? Math.floor(heightProportion) : canvas.height);
    }
    /**
     * The function that is called to update the video, and schedule another update after an amount of milliseconds.
     * This is done instead of a setInterval since the milliseconds can be changed by the user in the Settings card.
     */
    function updateVideoWrapper() {
        updateVideo();
        setTimeout(() => {
            videoPlaybackId++
            updateVideoWrapper();
        }, Math.max(100, parseInt(document.getElementById("switch").value)));
    }
    updateVideoWrapper();
    document.getElementById("pipButton").onclick = () => video.requestPictureInPicture();
    /**
     * Close an HTMLDialogElement by applying an opacity transition
     * @param {HTMLDialogElement} dialog the Dialog to close
     */
    function closeDialog(dialog) {
        dialog.classList.remove("fullOpacity");
        setTimeout(() => { dialog.close() }, 300);
    }
    /**
    * Open an HTMLDialogElement by applying an opacity transition
    * @param {HTMLDialogElement} dialog the Dialog to open
    */
    function openDialog(dialog) {
        dialog.showModal();
        requestAnimationFrame(() => dialog.classList.add("fullOpacity"));
    }
    for (const item of document.querySelectorAll("[data-triggerupdate]")) item.addEventListener("change", () => updateVideo()); // Regenerate the Canvas when the user changes some settings
    for (const item of document.querySelectorAll("[data-setting]")) {
        const restoreOptions = JSON.parse(localStorage.getItem("ImagePiP-Settings") ?? "{}");
        if (restoreOptions[item.getAttribute("data-setting")]) item[item.type === "checkbox" ? "checked" : "value"] = restoreOptions[item.getAttribute("data-setting")]; // Restore previously-saved settings
        item.addEventListener("change", () => { // Add an event to save the Settings when edited
            let restoreOptions = JSON.parse(localStorage.getItem("ImagePiP-Settings") ?? "{}");
            restoreOptions[item.getAttribute("data-setting")] = item[item.type === "checkbox" ? "checked" : "value"];
            localStorage.setItem("ImagePiP-Settings", JSON.stringify(restoreOptions));
        })
    }
    let isLightThemeEnabled = localStorage.getItem("ImagePiP-Theme") === "1";
    const themes = {
        dark: {
            background: "#151515",
            text: "#fafafa",
            card: "#313131"
        },
        light: {
            background: "#fafafa",
            text: "#151515",
            card: "#fafafa"
        }
    }
    /**
     * Change the theme, according to the `isLightThemeEnabled` value.
     */
    function changeTheme() {
        for (const item in themes.dark) document.body.style.setProperty(`--${item}`, `${themes[isLightThemeEnabled ? "light" : "dark"][item]}`)
    }
    changeTheme();
    document.getElementById("changeTheme").onclick = () => {
        isLightThemeEnabled = !isLightThemeEnabled;
        changeTheme();
        localStorage.setItem("ImagePiP-Theme", isLightThemeEnabled ? "1" : "0");
    }
    const version = "1.0.0";
    document.getElementById("version").textContent = version;
    if ("serviceWorker" in navigator) {
        let registration;
        const registerServiceWorker = async () => {
            registration = await navigator.serviceWorker.register('./service-worker.js', { scope: `${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"))}/` });
        };
        registerServiceWorker();
    }
    fetch("./imagepip-updatecode", { cache: "no-store" }).then((res) => res.text().then((text) => { if (text.replace("\n", "") !== version) if (confirm(`There's a new version of Image Picture-in-Picture. Do you want to update? [${version} --> ${text.replace("\n", "")}]`)) { caches.delete("imagepip-cache"); location.reload(true); } }).catch((e) => { console.error(e) })).catch((e) => console.error(e));
})()