import { generateTarBlob } from "./tarts";


function App() {

  const handleClick = async () => {
    const tarBlob = await generateTarBlob(document.getElementById("file-input").files);
    console.log(tarBlob)
    document.getElementById("size").innerText = (tarBlob.size / 1024 / 1024).toFixed(2) + " MB";
    document.getElementById("download-link").href = URL.createObjectURL(tarBlob);
  }

  return (
    <div style={{ "padding": "40px" }}>
      <p>Size : &nbsp;<span id="size"></span></p>
      <p>Tar file : &nbsp;<a href="#" download="test.tar" id="download-link">Download</a></p>
      <input
        id="file-input"
        directory="true"
        multiple
        type="file"
        webkitdirectory="true" />
      <button onClick={handleClick}>Click me</button>
    </div>
  );
}

export default App;
