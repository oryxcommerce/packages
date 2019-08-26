# Oryx scheduler

```
const { postMessage } = require("@oryxcommerce/scheduler");

postMessage({
  data: {
    url: "https://google.com"
  },
  options: {
    delay: 'in 5 minutes',
    pubsub: {
      projectId: "PUBSUB PROJECT ID",
      topic: "hello"
    },
    bull: {
      queueName: "pubsub",
      redis: "redis://127.0.0.1:6379"
    }
  }
})
  .then(data => {
    console.log("DONE", data);
  })
  .catch(err => {
    console.log(err);
  });


```
