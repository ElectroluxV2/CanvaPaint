/// <reference lib="webworker" />
import { Paint } from './paint';

const paint = new Paint();

addEventListener('message', ({ data }) => {

  console.log(data);

  // postMessage(response);
});
