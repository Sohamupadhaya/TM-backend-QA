import { Kafka } from 'kafkajs';
import { Buffer } from 'buffer';

const kafka = new Kafka({
    clientId: 'video-producer',
    brokers: ['192.168.1.84:9092'],
    requestTimeout: 30000, // Optional: To handle larger messages
    retry: {
        retries: 5,
    },
});

const producer = kafka.producer({
    maxInFlightRequests: 1,        // Ensures messages are sent in order
  allowAutoTopicCreation: true,  // Automatically create topics if they don't exist
//   maxMessageSize: 5000000,   
});

// Function to start the producer
export async function startProducer() {
  try {
    await producer.connect();
    console.log('Kafka producer connected.');
  } catch (error) {
    console.error('Error connecting to Kafka producer:', error);
  }
}

const MAX_CHUNK_SIZE = 1000000; // 1MB
// Send video chunk to Kafka
export async function sendVideoChunk(employeeId: string, chunkData: Buffer) {
    const nowInUTC = new Date().toISOString();
    const base64Chunk = chunkData.toString('base64');
  
    // Split chunk into smaller chunks if too large
    const numChunks = Math.ceil(base64Chunk.length / MAX_CHUNK_SIZE);
    
    for (let i = 0; i < numChunks; i++) {
      const chunkPart = base64Chunk.slice(i * MAX_CHUNK_SIZE, (i + 1) * MAX_CHUNK_SIZE);
  
      try {
        await producer.send({
          topic: 'video-chunks',
          messages: [
            {
              key: employeeId,
              value: JSON.stringify({
                employeeId,
                chunk: chunkPart,
                timestamp: nowInUTC,
                chunkIndex: i,  // Keep track of chunk part number
                totalChunks: numChunks
              }),
            },
          ],
        });
  
        console.log(`Video chunk part ${i + 1}/${numChunks} sent to Kafka for Employee ID: ${employeeId}`);
      } catch (error) {
        console.error('Error sending video chunk part to Kafka:', error);
      }
    }
  }

// Function to disconnect the producer gracefully
export async function disconnectProducer() {
  try {
    await producer.disconnect();
    console.log('Kafka producer disconnected.');
  } catch (error) {
    console.error('Error disconnecting Kafka producer:', error);
  }
}
