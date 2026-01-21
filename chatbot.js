const node_kakao = require('node-kakao');
const keepAlive = require('./server.js');
const axios = require('axios');
const FormData = require('form-data');
const { TalkClient, AuthApiClient, xvc, KnownAuthStatusCode, util, AttachmentApi } = require("node-kakao");

const DEVICE_TYPE = "tablet";
let DEVICE_UUID = "";
const DEVICE_NAME = "ImageReceiverBot";
const EMAIL = 'coxaaa@nate.com';
const PASSWORD = 'wud3154rud!!';
let client = new node_kakao.TalkClient();

client.on('error', (err) => {
    console.log(`클라이언트 에러 발생\n오류: ${err.stack}`);
});

client.on('disconnected', (reason) => {
    console.log(`연결이 끊어졌습니다.\n사유: ${reason}`);
});

client.on('chat', async (data, channel) => {
    if (data.chat.type == node_kakao.KnownChatType.PHOTO) {
        try {
            const attachment = data.attachment();
            if (attachment && attachment.url) {
                const imageResponse = await axios.get(attachment.url, {
                    responseType: 'arraybuffer',
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }
                });

                const form = new FormData();
                form.append('image', imageResponse.data, {
                    filename: 'kakao_received_image.jpg',
                    contentType: attachment.mt
                });

                const uploadResponse = await axios.post('mgf.gg/mgf/api/botwriter.php', form, {
                    headers: {
                        ...form.getHeaders()
                    }
                });

                if (uploadResponse.status === 200) {
                    channel.sendChat(`✅ 이미지가 성공적으로 업로드되었습니다.`);
                } else {
                    channel.sendChat(`❌ 이미지 업로드에 실패했습니다: ${uploadResponse.status}`);
                }
            }
        } catch (error) {
            console.error('이미지 처리 중 오류 발생: ', error.message);
        }
    }
});

async function registerDevice(authClient) {
    let requestData = await authClient.requestPasscode({"email": EMAIL, "password": PASSWORD, "forced": true});
    if (!requestData.success) {
    return {"success": false, "message": `보안코드 요청에 실패했습니다.\n데이터: ${JSON.stringify(requestData, null, 2)}`};
    } else {
        let readline = require("readline");
        let inputInterface = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        let passcode = await new Promise((resolve) => inputInterface.question("보안코드 입력: ", resolve));
        inputInterface.close();
        let registerData = await authClient.registerDevice({"email": EMAIL, "password": PASSWORD, "forced": true}, passcode, true);
        if (!registerData.success) {
            return {"success": false, "message": `기기등록에 실패했습니다.\n데이터: ${JSON.stringify(registerData, null, 2)}`};
        }
        return {"success": true};
    }
}

async function login() {
    let config = { countryIso: "KR", language: "ko" };
    if (DEVICE_UUID === "") {
        if (DEVICE_TYPE === "pc") {
            DEVICE_UUID = util.randomWin32DeviceUUID();
        }
        if (DEVICE_TYPE === "tablet") {
            DEVICE_UUID = util.randomAndroidSubDeviceUUID();
        }
        console.log(`uuid: ${DEVICE_UUID}`);
    }
    let authClient = await AuthApiClient.create(DEVICE_NAME, DEVICE_UUID, config, xvc.AndroidSubXVCProvider);
    let loginData = await authClient.login({"email": EMAIL, "password": PASSWORD, "forced": true});
    if (!loginData.success) {
        if (loginData.status === KnownAuthStatusCode.DEVICE_NOT_REGISTERED) {
            let result = await registerDevice(authClient);
            if (!result.success) {
                console.log(result.message);
            } else {
                login();
            }
        } else {
            console.log(`카카오톡 로그인에 실패했습니다.\n데이터: ${JSON.stringify(loginData, null, 2)}`);
        }
    } else {
        let loginRes = await client.login(loginData.result);
        if (!loginRes.success) {
            console.log(`카카오톡 로그인에 실패했습니다.\n로그인 결과: ${JSON.stringify(loginRes, null, 2)}`);
        } else {
            token = `${loginData.result.accessToken}-${loginData.result.deviceUUID}`;
            console.log(`카카오톡 로그인에 성공했습니다.`);
        }
    }
}

keepAlive();
login().then();