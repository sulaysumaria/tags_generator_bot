const dotenv = require('dotenv');
dotenv.config();

const TelegramBot = require('node-telegram-bot-api');
const download = require('download-file');
const request = require('request-promise');
const express = require('express');
const app = express();

const {PORT, TELEGRAM_BOT_TOKEN, HOST_DOMAIN, GOOGLE_VISION_API_KEY, IMAGES_FOLDER, CLARIFAI_API_KEY} = process.env;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {polling: true});

bot.on('message', async (msg) => {
  console.log('====================Starting====================');
  console.log('Recieved a new message');
  // console.log(msg);

  const chatId = msg.chat.id;

  if (msg.photo) {
    console.log('Got an Image');
    // console.log(msg.photo);

    const fileLink = await bot.getFile(msg.photo[msg.photo.length - 1].file_id);
    console.log('Fetched link from telegram');

    const now = Date.now();
    const fileName = `${now}.jpg`;

    const url = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileLink.file_path}`;

    const options = {
      directory: `./${IMAGES_FOLDER}`,
      filename: fileName,
    };

    download(url, options, async (err) => {
      if (err) throw err;

      try {
        console.log('Downloaded file to server.');

        const hashTags = await getHashTags(`${HOST_DOMAIN}/${fileName}`);
        console.log('Fetched hashtags');

        const hashTagsStr = hashTags.join(' ');
        console.log(hashTagsStr);

        bot.sendMessage(chatId, hashTagsStr);
        console.log('Message sent.');
        console.log('====================Finished====================');
      } catch (e) {
        console.log(e);
        bot.sendMessage(chatId, 'I lost the image somewhere in the closet, can you send it again?');
      }
    });
  } else if (msg.text === '/start') {
    bot.sendMessage(chatId, 'Try sending an image. I can generate hashtags based on what I see in the image.');
  } else {
    bot.sendMessage(
        chatId,
        'My sole purpose is to generate hash tags from an image. I cannot do anything else except that (at least for now.)'
    );
  }
});

function getHashTags(imageURL) {
  return new Promise(async (resolve, reject) => {
    let response;
    try {
      // const options = {
      //   method: 'POST',
      //   url: 'https://vision.googleapis.com/v1/images:annotate',
      //   qs: {key: GOOGLE_VISION_API_KEY},
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: {
      //     requests: [
      //       {
      //         features: [{type: 'LABEL_DETECTION'}],
      //         image: {
      //           source: {
      //             imageUri: imageURL,
      //           },
      //         },
      //       },
      //     ],
      //   },
      //   json: true,
      // };

      const options = {
        method: 'POST',
        url: 'https://api.clarifai.com/v2/models/aaa03c23b3724a16a56b629203edc62c/versions/aa7f35c01e0642fda5cf400f543e7c40/outputs',
        headers: {
          'Authorization': `Key ${CLARIFAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: {
          inputs: [
            {
              data: {
                image: {
                  url: imageURL,
                },
              },
            },
          ],
        },
        json: true,
      };

      response = await request(options);
      // console.log(JSON.stringify(options, null, 2));
      // console.log(JSON.stringify(response, null, 2));

      // const hashTags = response.responses[0].labelAnnotations.map((a) => `#${a.description.replace(/\s/gi, '')}`);
      const hashTags = response.outputs[0].data.concepts.map((a) => `#${a.name.replace(/\s/gi, '')}`);

      return resolve(hashTags);
    } catch (e) {
      console.log(e);
      console.log(response);
      return reject(e);
    }
  });
}

app.use(express.static(IMAGES_FOLDER));

app.listen(PORT, () => console.log(`App listening on port ${PORT}!`));
