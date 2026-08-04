import axios from 'axios';

const client = axios.create({
  headers: { Accept: 'application/json' },
});

export const httpGet = async (url, options = {}) => {
  const { data } = await client.get(url, {
    headers: options.headers,
    signal: options.signal,
  });
  return data;
};

export const httpPost = async (url, body, options = {}) => {
  const { data } = await client.post(url, body, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    signal: options.signal,
  });
  return data;
};
