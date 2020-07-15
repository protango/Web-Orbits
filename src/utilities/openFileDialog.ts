export default function openFileDialog(accept: string, multiple: boolean) {
    let fileInput = document.getElementById("globalFileInput") as HTMLInputElement;
    if (fileInput) {
        fileInput.onchange(null);
    }

    fileInput = document.createElement("input");
    fileInput.style.width = "0";
    fileInput.style.height = "0";
    fileInput.style.padding = "0";
    fileInput.style.margin = "0";
    fileInput.style.position = "absolute";
    fileInput.type = "file";
    fileInput.id = "globalFileInput";
    fileInput.accept = accept;
    fileInput.multiple = multiple;
    document.body.appendChild(fileInput);
    fileInput.click();

    return new Promise<FileList>(r => {
        fileInput.onchange = (e) => {
            if (e === null) {
                r(null);
                fileInput.remove();
            } else {
                r(fileInput.files);
            }
        }
    });
}