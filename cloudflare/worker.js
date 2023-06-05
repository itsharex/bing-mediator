const SYDNEY_ORIGIN = 'https://sydney.bing.com';
const KEEP_REQ_HEADERS = [
  'accept',
  'accept-encoding',
  'accept-language',
  'connection',
  'cookie',
  'upgrade',
  'user-agent',
  'sec-websocket-extensions',
  'sec-websocket-key',
  'sec-websocket-version',
  'x-request-id',
  'content-length',
  'content-type',
  'access-control-request-headers',
  'access-control-request-method',
];
const IP_RANGE = [
  ['3.2.50.0', '3.5.31.255'], //192,000
  ['3.12.0.0', '3.23.255.255'], //786,432
  ['3.30.0.0', '3.33.34.255'], //205,568
  ['3.40.0.0', '3.63.255.255'], //1,572,864
  ['3.80.0.0', '3.95.255.255'], //1,048,576
  ['3.100.0.0', '3.103.255.255'], //262,144
  ['3.116.0.0', '3.119.255.255'], //262,144
  ['3.128.0.0', '3.247.255.255'], //7,864,320
];

/**
 * 随机整数 [min,max)
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min)) + min;

/**
 * 将ip地址转换为整数
 * @param {string} ip - 正常格式的IP地址，例如 '192.168.1.1'
 * @returns {number} - 四个数字经过位移运算后得到的整数，例如 3232235777
 */
const ipToInt = (ip) => {
  const ipArr = ip.split('.');
  let result = 0;
  result += +ipArr[0] << 24;
  result += +ipArr[1] << 16;
  result += +ipArr[2] << 8;
  result += +ipArr[3];
  return result;
};

/**
 * 将整数转换为ip地址
 * @param {number} intIP - 由四个数字经过位移运算后得到的整数，例如 3232235777
 * @returns {string} - 正常格式的IP地址，例如 '192.168.1.1'
 */
const intToIp = (intIP) => {
  return `${(intIP >> 24) & 255}.${(intIP >> 16) & 255}.${(intIP >> 8) & 255}.${intIP & 255}`;
};

/**
 * 随机获取一个ip地址
 * @returns {string} - 正常格式的IP地址，例如 '192.168.1.1'
 */
const getRandomIP = () => {
  const randIndex = getRandomInt(0, IP_RANGE.length);
  const startIp = IP_RANGE[randIndex][0];
  const endIp = IP_RANGE[randIndex][1];
  const startIPInt = ipToInt(startIp);
  const endIPInt = ipToInt(endIp);
  const randomInt = getRandomInt(startIPInt, endIPInt);
  const randomIP = intToIp(randomInt);
  return randomIP;
};

/**
 * 根据路由返回相应的内容，home函数的一部分
 * @param {string} pathname
 * @returns {Response}
 */
const handleRequestByRoute = (pathname) => {
  const baseUrl = 'https://raw.githubusercontent.com/kirklin/bing-mediator/main/';
  let url;
  if (pathname.indexOf('/github/') === 0) {
    url = pathname.replace('/github/', baseUrl);
  } else {
    url = baseUrl + 'cloudflare/index.html';
  }
  return fetch(url)
      .then(res => {
        const newRes = new Response(res.body, res);
        if (pathname === '/') {
          newRes.headers.delete('content-security-policy');
          newRes.headers.set('content-type', 'text/html; charset=utf-8');
        }
        return newRes;
      });
}

/**
 * home函数，根据路由返回相应的内容
 * @param {string} pathname - 用于决定返回内容的路由字符串
 * @returns {Response}
 */
const home = async (pathname) => {
  return await handleRequestByRoute(pathname);
};

/**
 * fetch函数
 * @param {Request} request - 客户端请求
 * @param {*} env
 * @param {*} ctx
 * @returns {Response} - 用于响应客户端的Response
 */
const fetchProxy = async (request, env, ctx) => {
  const currentUrl = new URL(request.url);
  let response;
  if (currentUrl.pathname === '/' || currentUrl.pathname.indexOf('/github/') === 0) {
    response = await home(currentUrl.pathname);
  }
  else {
    response = await handleOriginRequest(request, currentUrl);
  }
  return response;
};

/**
 * 正向代理请求
 * @param {Request} request - 客户端请求
 * @param {URL} currentUrl - 已提取出来的URL对象
 * @returns {Response} - 用于响应客户端的Response
 */
const handleOriginRequest = async (request, currentUrl) => {
  const targetUrl = new URL(SYDNEY_ORIGIN + currentUrl.pathname + currentUrl.search);

  // 组装请求头
  const newHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (KEEP_REQ_HEADERS.includes(key)) {
      newHeaders.set(key, value);
    }
  });
  newHeaders.set('host', targetUrl.host);
  newHeaders.set('origin', targetUrl.origin);
  newHeaders.set('referer', 'https://www.bing.com/search?q=Bing+AI');
  const randIP = getRandomIP();
  newHeaders.set('X-Forwarded-For', randIP);
  const oldUA = request.headers.get('user-agent');
  const isMobile = oldUA.includes('Mobile') || oldUA.includes('Android');
  if (isMobile) {
    newHeaders.set(
        'user-agent',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.7 Mobile/15E148 Safari/605.1.15 BingSapphire/1.0.410427012'
    );
  } else {
    newHeaders.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.35');
  }

  // 发送请求
  const newReq = new Request(targetUrl, {
    method: request.method,
    headers: newHeaders,
    body: request.body,
  });
  const response = await fetch(newReq);
  return response;
};

export default {
  fetch: fetchProxy
};
