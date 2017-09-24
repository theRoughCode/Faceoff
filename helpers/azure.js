// Change if we ever make this good: use request or http
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

// Returns a 2-tuple. The first element of the tuple is the status of the request.
// If the request was successful, the second element is the happiness score. Otherwise, it is
// the error message.
function sendBlob(req, res)
{
	// console.log(req.file)

	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			var emotions = JSON.parse(this.responseText);
			if (emotions.length && emotions[0]["scores"])
			{
				res.send(200, emotions[0]["scores"]["happiness"]);
			}
			else
			{
				res.send(418, "Face not found");
			}
		}
	};
	
	xhr.open("POST", "https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize?", true);
	xhr.setRequestHeader("Content-Type","application/octet-stream");
	xhr.setRequestHeader("Ocp-Apim-Subscription-Key", process.env.EMOTION_KEY);
	xhr.send(req.file.buffer);
}

module.exports = {sendBlob};