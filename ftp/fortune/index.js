const express = require('express')
const app = express()
const port = 3000
const fortunecmd = "fortune";

var html = `
<html><head></head><body>
  <script>
    function get() {
      fetch("/fortune").then(data => data.text()).then(data => {
        document.getElementById("furt").innerHTML = data
      })
    }
</script>
  <p>Press this button to get a fortune, technical details are below</p>
  <p id="furt"></p>
  <button onclick="get()">Get Fortune</button>

<hr>
  <p>Copyrigth (C) Abdul Karim Kikar 2021</p>
<p>Technical details:
  <br>Unix command used: <code>Fortune</code>
  <br>Running Express.JS in Node.JS
  <br>Running on port 8080.
  <a href="https://oklomsy.com/ftp/fortune">Source code here.</a>
</p>
</body></html>
`

function run(cmd, callback) {
    var spawn = require('child_process').spawn;
    var command = spawn(cmd);
    var result = '';
    command.stdout.on('data', function(data) {
         result += data.toString();
    });
    command.on('close', function(code) {
        return callback(result);
    });
}

app.get('/', (req, res) => {
	res.send(html)
});

app.get('/fortune', (req, res) => {
	run(fortunecmd, function(result) {
		res.send(result);
	});
});

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
});


