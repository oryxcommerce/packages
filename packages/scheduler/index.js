const Queue = require("bull");
const humanInterval = require("human-interval");

module.exports.postMessage = async (
  queueName,
  queueData,
  queueOptions = { delay: 0, server: "redis://127.0.0.1:6379" }
) => {
  let { delay } = queueOptions;
  const { server } = queueOptions;

  // Convert delay to human readable
  delay = humanInterval(delay);

  // Create our queue instance
  const queue = Queue(queueName, server);

  // Submit job to the queue
  const data = await queue.add(queueData, {
    delay
  });

  // Make sure the queue is closed
  queue.close();

  // make sure to return at least an empty json
  return data || {};
};
