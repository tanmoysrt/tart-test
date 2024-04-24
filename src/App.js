import { generateTarBlob } from "./tarts";


function App() {

  const handleClick = async () => {
    const startTime = Date.now();
    document.getElementById("status").innerText = "Generating tar file...";
    const tarBlob = await generateTarBlob(document.getElementById("file-input").files);
    const requiredTime = Date.now() - startTime;
    document.getElementById("size").innerText = (tarBlob.size / 1024 / 1024).toFixed(2) + " MB";
    document.getElementById("download-link").href = URL.createObjectURL(tarBlob);
    document.getElementById("time").innerText = (requiredTime / 1000) + " seconds";
    document.getElementById("status").innerText = "Done";
  }

  return (
    <div style={{ "padding": "40px" }}>
      <p>Status : &nbsp;<span id="status"></span></p>
      <p>Time : &nbsp;<span id="time"></span></p>
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
