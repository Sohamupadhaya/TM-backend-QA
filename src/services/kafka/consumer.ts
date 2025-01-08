import { Kafka } from 'kafkajs';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';

const VIDEO_DIR = 'uploads/timelapsevideo';

const kafka = new Kafka({
  clientId: 'video-consumer',
  brokers: ['192.168.1.84:9092'], // Replace with your Kafka broker addresses
});

const consumer = kafka.consumer({ groupId: 'video-group' });

// Store file streams and paths for each user
const userFileStreams: { [key: string]: { fileStream: fs.WriteStream; filePath: string } } = {};

// Start Kafka consumer
export async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'video-chunks', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const { employeeId, chunk, timestamp } = JSON.parse(message.value!.toString());
      const chunkData = Buffer.from(chunk, 'base64');

      // Initialize stream for the employee if not already created
      if (!userFileStreams[employeeId]) {
        const filePath = path.join(VIDEO_DIR, `video-${employeeId}-${Date.now()}.webm`);
        const fileStream = fs.createWriteStream(filePath, { flags: 'a' });

        userFileStreams[employeeId] = { fileStream, filePath };
        console.log(`Recording started for Employee ID: ${employeeId}, saving to: ${filePath}`);
      }

      // Get the employee's file stream and write the chunk
      const { fileStream } = userFileStreams[employeeId];
      if (fileStream && !fileStream.closed) {
        fileStream.write(chunkData);
        console.log(`Video chunk written to file for Employee ID: ${employeeId}`);
      } else {
        console.error(`Stream closed for Employee ID: ${employeeId}`);
      }
    },
  });
}
