const Queue = require("bull");
const { PubSub } = require("@google-cloud/pubsub");
const humanInterval = require("human-interval");

const postMessage = async ({
  data,
  options = {
    delay: 0,
    pubsub: {
      projectId: null,
      topic: null
    },
    bull: {
      queueName: null,
      redis: "redis://127.0.0.1:6379"
    }
  }
}) => {
  let { delay } = options;
  const { projectId, topic } = options.pubsub;
  const { redis: server, queueName } = options.bull;

  // Convert delay to human readable
  delay = humanInterval(delay) || 0;

  // should be scheduled inside bull
  if (delay > 0) {
    // we add the topic inside the job
    const realData = { ...data, topic };
    const bullData = await sendToBull({
      queueName,
      server,
      data: realData,
      delay
    });
    return { status: "success", errors: null, type: "bull", debug: bullData };
  } else {
    // send directly to PubSub
    const pubSubData = await sendToPubSub({ projectId, topic, data });
    return {
      status: "success",
      errors: null,
      type: "pubsub",
      debug: { id: pubSubData }
    };
  }

  // make sure to return at least an empty json
  return { status: "failed", errors: "Unknown error" };
};

const sendToBull = async ({ queueName, data, server, delay }) => {
  // should be scheduled inside bull
  if (delay === 0) {
    throw new Error("Please use PubSub instead");
  }

  // Create our queue instance
  const queue = Queue(queueName, server);

  // Submit job to the queue
  const bullData = await queue.add(data, {
    delay
  });

  // Make sure the queue is closed
  queue.close();

  // make sure to return at least an empty json
  return bullData || {};
};

const sendToPubSub = async ({ projectId, topic, data }) => {
  const pubsub = new PubSub({ projectId });
  const dataBuffer = Buffer.from(JSON.stringify(data));
  const dataReturned = await pubsub.topic(topic).publish(dataBuffer);

  return dataReturned || {};
};

module.exports = {
  postMessage,
  sendToBull,
  sendToPubSub
};
