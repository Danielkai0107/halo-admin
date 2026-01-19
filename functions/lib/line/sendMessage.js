"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = exports.sendAlertAssignment = void 0;
const bot_sdk_1 = require("@line/bot-sdk");
const sendAlertAssignment = async (lineUserId, channelAccessToken, alertData) => {
    const client = new bot_sdk_1.Client({
        channelAccessToken,
    });
    // 建立 Flex Message
    const flexMessage = {
        type: 'flex',
        altText: `警報分配通知：${alertData.title}`,
        contents: {
            type: 'bubble',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: '警報分配通知',
                        weight: 'bold',
                        size: 'lg',
                        color: '#FFFFFF',
                    },
                ],
                backgroundColor: alertData.severity === 'CRITICAL' ? '#DC2626' :
                    alertData.severity === 'HIGH' ? '#EA580C' :
                        alertData.severity === 'MEDIUM' ? '#D97706' : '#2563EB',
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: alertData.title,
                        weight: 'bold',
                        size: 'md',
                        wrap: true,
                        margin: 'none',
                    },
                    {
                        type: 'text',
                        text: alertData.message,
                        size: 'sm',
                        wrap: true,
                        margin: 'md',
                        color: '#666666',
                    },
                    {
                        type: 'separator',
                        margin: 'lg',
                    },
                    {
                        type: 'box',
                        layout: 'vertical',
                        margin: 'lg',
                        spacing: 'sm',
                        contents: [
                            {
                                type: 'box',
                                layout: 'baseline',
                                spacing: 'sm',
                                contents: [
                                    {
                                        type: 'text',
                                        text: '長輩',
                                        size: 'sm',
                                        color: '#999999',
                                        flex: 2,
                                    },
                                    {
                                        type: 'text',
                                        text: alertData.elderName,
                                        size: 'sm',
                                        color: '#111111',
                                        flex: 5,
                                        wrap: true,
                                    },
                                ],
                            },
                            ...(alertData.elderPhone ? [{
                                    type: 'box',
                                    layout: 'baseline',
                                    spacing: 'sm',
                                    contents: [
                                        {
                                            type: 'text',
                                            text: '電話',
                                            size: 'sm',
                                            color: '#999999',
                                            flex: 2,
                                        },
                                        {
                                            type: 'text',
                                            text: alertData.elderPhone,
                                            size: 'sm',
                                            color: '#111111',
                                            flex: 5,
                                        },
                                    ],
                                }] : []),
                            {
                                type: 'box',
                                layout: 'baseline',
                                spacing: 'sm',
                                contents: [
                                    {
                                        type: 'text',
                                        text: '時間',
                                        size: 'sm',
                                        color: '#999999',
                                        flex: 2,
                                    },
                                    {
                                        type: 'text',
                                        text: new Date(alertData.triggeredAt).toLocaleString('zh-TW'),
                                        size: 'sm',
                                        color: '#111111',
                                        flex: 5,
                                        wrap: true,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: [
                    {
                        type: 'button',
                        style: 'primary',
                        action: {
                            type: 'uri',
                            label: '查看詳情',
                            uri: `https://liff.line.me/${process.env.LIFF_ID}/alerts/${alertData.id}`,
                        },
                    },
                    {
                        type: 'text',
                        text: '請盡快確認並處理此警報',
                        size: 'xs',
                        color: '#999999',
                        align: 'center',
                        margin: 'sm',
                    },
                ],
            },
        },
    };
    // 發送訊息
    await client.pushMessage(lineUserId, flexMessage);
};
exports.sendAlertAssignment = sendAlertAssignment;
const sendNotification = async (lineUserId, channelAccessToken, message) => {
    const client = new bot_sdk_1.Client({
        channelAccessToken,
    });
    await client.pushMessage(lineUserId, {
        type: 'text',
        text: message,
    });
};
exports.sendNotification = sendNotification;
//# sourceMappingURL=sendMessage.js.map