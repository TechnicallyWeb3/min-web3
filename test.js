// save as test.js
import http from 'k6/http';
import { sleep } from 'k6';

export let options = { vus: 10, duration: '30s' }; // 10 virtual users for 30s
export default function () {
  http.get('https://w3.mancino.ca/');
  sleep(1);
}
