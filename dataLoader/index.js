import axios from "axios";
import * as cheerio from 'cheerio';
import logger from "../logger/index.js";

export default function () {
    async function __sendRequest(config) {
        return new Promise((resolve, reject) => {
            axios(config)
                .then((response) => {
                    const body = response.data;
                    var $ = cheerio.load(body);
                    if ($('.offer-wrapper').length > 0) {
                        const result = [];
                        $(".offer-wrapper").each(function (i, elem) {
                            let $element = $(elem);
                            let id = $element.find('.breakword').data('id');
                            let link = $element.find('.detailsLink').attr('href');
                            result.push({ id, link });
                        });
                        resolve(result);
                    } else {
                        logger.log('error', 'Response is empty');
                    }
                })
                .catch(function (error) {
                    logger.log('error', 'Load data error: ' + error);
                    reject([]);
                });
        });
    }

    function __getConfigPrivate(cookie) {
        return {
            method: 'get',
            url: 'https://www.olx.ua/nedvizhimost/kvartiry/dolgosrochnaya-arenda-kvartir/ivano-frankovsk/?search%5Bprivate_business%5D=private',
            headers: {
                'authority': 'www.olx.ua',
                'pragma': 'no-cache',
                'cache-control': 'no-cache',
                'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="99", "Google Chrome";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-user': '?1',
                'sec-fetch-dest': 'document',
                'referer': 'https://www.olx.ua/',
                'accept-language': 'en-US,en;q=0.9',
                'cookie': cookie
            }
        };
    }

    function __getConfigBusiness(cookie) {
        return {
            method: 'get',
            url: 'https://www.olx.ua/nedvizhimost/kvartiry/dolgosrochnaya-arenda-kvartir/ivano-frankovsk/?search%5Bprivate_business%5D=business',
            headers: {
                'authority': 'www.olx.ua',
                'pragma': 'no-cache',
                'cache-control': 'no-cache',
                'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="99", "Google Chrome";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-user': '?1',
                'sec-fetch-dest': 'document',
                'referer': 'https://www.olx.ua/',
                'accept-language': 'en-US,en;q=0.9',
                'cookie': cookie
            }
        };
    }

    async function __sendPrivateRequest(cookie) {
        const configPrivate = __getConfigPrivate(cookie);
        return __sendRequest(configPrivate);
    }

    async function __sendBusinessRequest(cookie) {
        const configBuss = __getConfigBusiness(cookie);
        return __sendRequest(configBuss);
    }

    return {
        sendRequest: async function (cookie) {
            let privateOffers = await __sendPrivateRequest(cookie);
            let businessOffers = await __sendBusinessRequest(cookie);

            return privateOffers.concat(businessOffers);
        }
    }
}


