const request = require('request-promise');
const fetch = require('fetch-base64');
const Clarifai = require('clarifai');

const {TELEGRAM_BOT_TOKEN, CLARAFAI_API_KEY} = process.env;

const getFileUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=`;
const sendMessageUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

const app = new Clarifai.App({
  apiKey: CLARAFAI_API_KEY,
});

async function tagMe(event) {
  return new Promise(async (resolve, reject) => {
    const msg = JSON.parse(event.body).message;
    const chatId = msg.chat.id;

    try {
      if (msg.photo) {
        const getFileResult = await request.get(getFileUrl + msg.photo[msg.photo.length - 1].file_id);

        const fileLink = JSON.parse(getFileResult);
        const url = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileLink.result.file_path}`;
        const [data] = await fetch.remote(url);

        const response = await app.models.predict(Clarifai.GENERAL_MODEL, {base64: data});
        const hashTags = response.outputs[0].data.concepts.map((a) => `#${a.name.replace(/[^a-zA-Z]/gi, '')}`);
        const hashTagsStr = hashTags.join(' ');

        await request.post(sendMessageUrl, {body: {chat_id: chatId, text: hashTagsStr}, json: true});
      } else if (msg.text === '/start') {
        await request.post(sendMessageUrl, {
          body: {
            chat_id: chatId,
            text: 'Try sending an image. I can generate hashtags based on what I see in the image.',
          },
          json: true,
        });
      } else {
        await request.post(sendMessageUrl, {
          body: {
            chat_id: chatId,
            text: 'My sole purpose is to generate hash tags from an image. I cannot do anything else except that (at least for now.)',
          },
          json: true,
        });
      }

      return resolve({statusCode: 200, body: JSON.stringify({message: 'Success'})});
    } catch (e) {
      console.log(e);
      await request.post(sendMessageUrl, {
        body: {chat_id: chatId, text: 'I lost the image somewhere in the closet, can you send it again?'},
        json: true,
      });

      return resolve({statusCode: 200, body: JSON.stringify({message: 'Failed'})});
    }
  });
}

module.exports = {
  tagMe,
};
