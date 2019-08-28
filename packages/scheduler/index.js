const Queue = require('bull');
const {PubSub} = require('@google-cloud/pubsub');
const humanInterval = require('human-interval');
const defaults = require('lodash.defaults');

const defaultOptions = {
  delay: 'now',
  pubsub: {
    projectId: null,
    topic: null,
  },
  bull: {
    queueName: null,
    redis: 'redis://127.0.0.1:6379',
  },
};

const sendToBull = async ({queueName, data, server, delay}) => {
  // should be scheduled inside bull
  if (delay === 0) {
    throw new Error('Please use PubSub instead');
  }

  // Create our queue instance
  const queue = Queue(queueName, server);

  // Submit job to the queue
  const bullData = await queue.add(data, {
    delay,
  });

  // Make sure the queue is closed
  queue.close();

  // make sure to return at least an empty json
  return bullData || {};
};

const sendToPubSub = async ({projectId, topic, data}) => {
  const pubsub = new PubSub({projectId});
  const dataBuffer = Buffer.from(JSON.stringify(data));
  const dataReturned = await pubsub.topic(topic).publish(dataBuffer);

  return dataReturned || {};
};

const postMessage = async ({data, options = defaultOptions}) => {
  const builtOptions = defaults(options, defaultOptions);
  let {delay} = builtOptions;
  const {projectId, topic} = builtOptions.pubsub;
  const {redis: server, queueName} = builtOptions.bull;

  // Convert delay to human readable
  if (typeof delay === 'string') {
    // we strip `in ` because they seems to have some issue
    delay = humanInterval(delay.replace('in ', '')) || 0;
  }

  try {
    // should be scheduled inside bull
    if (delay > 0) {
      // we add the topic inside the job
      const realData = {...data, topic};
      const bullData = await sendToBull({
        queueName,
        server,
        data: realData,
        delay,
      });
      return {status: 'success', error: null, type: 'bull', debug: bullData};
    } else {
      // send directly to PubSub
      const pubSubData = await sendToPubSub({projectId, topic, data});
      return {
        status: 'success',
        error: null,
        type: 'pubsub',
        debug: pubSubData,
      };
    }
  } catch (error) {
    // make sure to return at least an empty json
    return {status: 'failed', error};
  }
};

module.exports = {
  postMessage,
  sendToBull,
  sendToPubSub,
};
