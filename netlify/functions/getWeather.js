const https = require('https');

exports.handler = async (event) => {
    const { nx, ny, baseDate, baseTime, serviceKey } = event.queryStringParameters;

    const url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${serviceKey}&numOfRows=10&pageNo=1&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;

    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                resolve({
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: data,
                });
            });
        }).on('error', (error) => {
            reject({
                statusCode: 500,
                body: JSON.stringify({ error: error.message }),
            });
        });
    });
};
