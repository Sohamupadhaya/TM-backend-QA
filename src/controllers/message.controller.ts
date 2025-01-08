import { NextFunction, Request, Response } from "express";
import { customErrorHandler } from "../utils/customErrorHandler.js";
import { createToken } from "../utils/createToken.js";
import prisma from "../models/index.js";
import { getReceiverSocketId,io } from "../socket/socket.js";


// export const sendMessage1 = async(req:Request,res:Response,next:NextFunction)=>{
//     try {
//         const {message} = req.body
//         const { id: receiverId } = req.params;
// 		const senderId = (req as any).user.employeeId;

// 		let conversation = await prisma.conversation.findFirst({
// 			where: {
// 				participantIds: {
// 					hasEvery: [senderId, receiverId],
// 				},
// 			},
// 		});

//         if (!conversation) {
// 			conversation = await prisma.conversation.create({
// 				data: {
// 					participantIds: {
// 						set: [senderId, receiverId],
// 					},
// 				},
// 			});
// 		}

// 		const newMessage = await prisma.message.create({
// 			data: {
// 				senderId,
// 				body: message,
// 				conversationId: conversation.id,
// 			},
// 		});

// 		if (newMessage) {
// 			conversation = await prisma.conversation.update({
// 				where: {
// 					id: conversation.id,
// 				},
// 				data: {
// 					messages: {
// 						connect: {
// 							id: newMessage.id,
// 						},
// 					},
// 				},
// 			});
// 		}

//         const receiverSocketId = getReceiverSocketId(receiverId);

// 		if (receiverSocketId) {
// 			io.to(receiverSocketId).emit("newMessage", newMessage);
// 		}

//         return res.json(
//             newMessage
//         )
        
//     } catch (error) {
//         console.log(error,"ERROR")
//         return next(customErrorHandler(res,"Internal Server Error",500))
//     }
// }

// export const getMessage1 = async(req:Request,res:Response,next:NextFunction)=>{
//     try {
// 		const { id: userToChatId } = req.params;
// 		const senderId =  (req as any).user.employeeId;

// 		const conversation = await prisma.conversation.findFirst({
// 			where: {
// 				participantIds: {
// 					hasEvery: [senderId, userToChatId],
// 				},
// 			},
// 			include: {
// 				messages: {
// 					orderBy: {
// 						createdAt: "asc",
// 					},
// 				},
// 			},
// 		});

// 		if (!conversation) {
// 			return res.status(200).json([]);
// 		}

// 		res.status(200).json(conversation.messages);
// 	} catch (error: any) {
// 		console.error("Error in getMessages: ", error.message);
// 		res.status(500).json({ error: "Internal server error" });
// 	}
// }


// export const getUsersForSideBar1 = async(req:Request,res:Response,next:NextFunction)=>{
//     try {
// 		const authUserId = (req as any).user.employeeId;
//         const companyId = (req as any).user.companyId

// 		const users = await prisma.employee.findMany({
// 			where: {
// 				employeeId: {
// 					not: authUserId,
// 				},
//                 companyId
// 			},
// 			select: {
// 				employeeId: true,
// 				employeeName: true,
// 			},
// 		});

// 		res.status(200).json(users);
// 	} catch (error: any) {
// 		console.error("Error in getUsersForSidebar: ", error.message);
// 		res.status(500).json({ error: "Internal server error" });
// 	}
// }



////////////////////////////////////////////////////////////

export const getMessage = async (req: Request, res: Response, next: NextFunction) => {
	const senderId = (req as any).user.employeeId;
	const receiverId = req.params.id;
	const chats = await prisma.message.findMany({
	  where: {
		OR: [
		  {senderId, receiverId},
		  {senderId: receiverId, receiverId: senderId},
		],
	  },
	  include: {sender: true, receiver: true, media: true},
	  // orderBy: { createdAt: 'desc' },
	});
	return res.json(chats);
  };
  export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
	const uploadedFiles = Array.isArray(req.files)
	  ? req.files.map((file) => ({
		  name: file.originalname,
		  filePath: `http://localhost:8000/uploads/message/${file.filename}`,
		  mimeType: file.mimetype,
		}))
	  : [];
	console.log('🚀 ~ uploadedFiles ~ uploadedFiles:', uploadedFiles);
	const senderId = (req as any).user.employeeId;
	const {receiverId, content} = req.body;
	const room = await findOrCreateIfNotExist([senderId, receiverId]);
	if (!room) {
	  return res.status(404).json({message: 'Room not found'});
	}
	const sender = await prisma.employee.findUnique({
	  where: {employeeId: senderId},
	});
	const receiver = await prisma.employee.findUnique({
	  where: {employeeId: receiverId},
	});
  
	if (!sender || !receiver) {
	  return res.status(404).json({message: 'User not found'});
	}
	const message = await prisma.message.create({
	  data: {
		content: content,
		senderId: senderId,
		receiverId: receiverId,
		roomId: room.id,
		media: {
		  create: uploadedFiles || [],
		},
	  },
	  include: {
		media: true,
		sender: true,
		receiver: true,
	  },
	});
  
	io.to(room.id).emit('newMessage', message);
	console.log(`Message sent to room ${room.id}`);
  
	return res.status(201).json(message);
  };
  export const findOrCreateIfNotExist = async (participants: string[]) => {
	// Find the room that has exactly the same participants
	const room = await prisma.room.findFirst({
	  where: {
		participants: {
		  every: {
			employeeId: {
			  in: participants,
			},
		  },
		},
	  },
	  include: {
		participants: true,
	  },
	});
	// Check if the found room has the exact number of participants
	if (room && room.participants.length === participants.length) {
	  return room;
	} else {
	  // If no matching room, create a new one
	  const users = await prisma.employee.findMany({
		where: {
		  employeeId: {
			in: participants,
		  },
		},
	  });
	  const newRoom = await prisma.room.create({
		data: {
		  participants: {
			connect: users.map((user) => ({employeeId: user.employeeId})),
		  },
		},
	  });
	  return newRoom;
	}
  };
  export const getUsersForSideBar = async (req: Request, res: Response, next: NextFunction) => {
	try {
	  const authUserId = (req as any).user.employeeId;
	  const companyId = (req as any).user.companyId;
  
	  const users = await prisma.employee.findMany({
		where: {
		  employeeId: {
			not: authUserId,
		  },
		  companyId,
		},
		select: {
		  employeeId: true,
		  employeeName: true,
		},
	  });
  
	  const usersWithMessages = await Promise.all(
		users.map(async (user) => {
		  // Fetch the most recent chat with the user
		  const recentMessage = await prisma.message.findFirst({
			where: {
			  OR: [
				{senderId: authUserId, receiverId: user.employeeId},
				{senderId: user.employeeId, receiverId: authUserId},
			  ],
			},
			orderBy: {createdAt: 'desc'},
			include: {sender: true, receiver: true},
		  });
		  // Count unread messages
		  const unreadCount = await prisma.message.count({
			where: {
			  receiverId: authUserId,
			  senderId: user.employeeId,
			  read: false,
			},
		  });
		  return {
			...user,
			recentMessage,
			unreadCount,
		  };
		}),
	  );
  
	  res.status(200).json(usersWithMessages);
	} catch (error: any) {
	  console.error('Error in getUsersForSidebar: ', error.message);
	  res.status(500).json({error: 'Internal server error'});
	}
  };
  
  export const getAllRoomIds = async () => {
	try {
	  const rooms = await prisma.room.findMany({
		select: {
		  id: true,
		},
	  });
	  const roomIds = rooms.map((room) => room.id);
  
	  return rooms;
	} catch (err: any) {
	  console.error('Error fetching room IDs: ', err.message);
	}
  };
  
  export const markMessagesAsRead = async (req: Request, res: Response, next: NextFunction) => {
	try {
	  const receiverId = (req as any).user.employeeId;
  
	  const {senderId} = req.params;
  
	  const updatedMessages = await prisma.message.updateMany({
		where: {
		  receiverId,
		  senderId,
		  read: false,
		},
		data: {
		  read: true,
		},
	  });
  
	  return res.status(200).json({
		message: `${updatedMessages.count} messages marked as read.`,
	  });
	} catch (err: any) {
	  console.error('Error marking messages as read: ', err.message);
	  return res.status(500).json({error: 'Internal server error'});
	}
  };
  export const markEmployeeMessagesAsRead = async (req: Request, res: Response) => {
	const receiverId = (req as any).user.employeeId;
	const senderId = req.params.id;
	const updatedMessages = await prisma.companyAndEmployeeMessage.updateMany({
	  where: {
		employeeReceiverId: receiverId,
		companySenderId: senderId,
		read: false,
	  },
	  data: {
		read: true,
	  },
	});
	return res.status(200).json({
	  message: `${updatedMessages.count} messages marked as read.`,
	});
  };
  export const markCompanyMessagesAsRead = async (req: Request, res: Response) => {
	const receiverId = (req as any).user.companyId;
	console.log('🚀 ~ markCompanyMessagesAsRead ~ receiverId:', receiverId);
	const senderId = req.params.id;
	console.log('🚀 ~ markCompanyMessagesAsRead ~ senderId:', senderId);
	const updatedMessages = await prisma.companyAndEmployeeMessage.updateMany({
	  where: {
		companyReceiverId: receiverId,
		employeeSenderId: senderId,
		read: false,
	  },
	  data: {
		read: true,
	  },
	});
	return res.status(200).json({
	  message: `${updatedMessages.count} messages marked as read.`,
	});
  };
  
  export const sentMessageToCompany = async (req: Request, res: Response, next: NextFunction) => {
	const uploadedFiles = Array.isArray(req.files)
	  ? req.files.map((file) => ({
		  name: file.originalname,
		  filePath: `http://localhost:8000/uploads/message/${file.filename}`,
		  mimeType: file.mimetype,
		}))
	  : [];
	console.log('🚀 ~ uploadedFiles ~ uploadedFiles:', uploadedFiles);
	console.log('dami dami..');
	const senderId = (req as any).user.employeeId;
	console.log('🚀 ~ sentMessageToCompany ~ senderId:', senderId);
	const {receiverId, content} = req.body;
	console.log('🚀 ~ sentMessageToCompany ~ receiverId:', receiverId);
	const room = await findOrCreateIfNotExistToCompany([senderId, receiverId]);
	console.log('🚀 ~ sentMessageToCompany ~ room:', room);
  
	const sender = await prisma.employee.findUnique({
	  where: {employeeId: senderId},
	});
	const receiver = await prisma.company.findUnique({
	  where: {companyId: receiverId},
	});
	if (!sender || !receiver) {
	  return res.status(404).json({message: 'User not found'});
	}
	const message = await prisma.companyAndEmployeeMessage.create({
	  data: {
		content: content,
		employeeSenderId: senderId,
		companyReceiverId: receiverId,
		roomId: room.id,
		media: {
		  create: uploadedFiles || [],
		},
	  },
	  include: {
		media: true,
		employeeSender: true,
		companyReceiver: true,
	  },
	});
	console.log('🚀 ~ sentMessageToCompany ~ message:', message);
	io.to(room.id).emit('sentMessage', message);
	console.log(`message sent to room ${room.id}`);
	return res.status(201).json(message);
  };
  export const sentMessageToEmployee = async (req: Request, res: Response, next: NextFunction) => {
	const uploadedFiles = Array.isArray(req.files)
	  ? req.files.map((file) => ({
		  name: file.originalname,
		  filePath: `http://localhost:8000/uploads/message/${file.filename}`,
		  mimeType: file.mimetype,
		}))
	  : [];
	const senderId = (req as any).user.companyId;
	console.log('🚀 ~ sentMessageToEmployee ~ senderId:', senderId);
	const {receiverId, content} = req.body;
	console.log('🚀 ~ sentMessageToEmployee ~ content:', content);
	console.log('🚀 ~ sentMessageToEmployee ~ receiverId:', receiverId);
	const room = await findOrCreateIfNotExistToEmployee([senderId, receiverId]);
	if (!room) {
	  return res.status(404).json({message: 'Room not found'});
	}
	const sender = await prisma.company.findUnique({
	  where: {companyId: senderId},
	});
	const receiver = await prisma.employee.findUnique({
	  where: {employeeId: receiverId},
	});
	if (!sender || !receiver) {
	  return res.status(404).json({message: 'User not found'});
	}
	const message = await prisma.companyAndEmployeeMessage.create({
	  data: {
		content: content,
		companySenderId: senderId,
		employeeReceiverId: receiverId,
		roomId: room?.id,
		media: {
		  create: uploadedFiles || [],
		},
	  },
	  include: {
		media: true,
		companySender: true,
		employeeReceiver: true,
	  },
	});
	io.to(room.id).emit('sentMessage', message);
	console.log(`message sent to room ${room.id}`);
	return res.status(201).json(message);
  };
  export const getEmployeeMessage = async (req: Request, res: Response, next: NextFunction) => {
	const senderId = (req as any).user.employeeId;
	console.log('🚀 ~ getEmployeeMessage ~ senderId:', senderId);
	const receiverId = req.params.id;
	console.log('🚀 ~ getEmployeeMessage ~ receiverId:', receiverId);
	console.log('🚀 ~ getEmployeeMessage ~ receiverId:', receiverId);
	const chats = await prisma.companyAndEmployeeMessage.findMany({
	  where: {
		OR: [
		  {employeeSenderId: senderId, companyReceiverId: receiverId},
		  {companySenderId: receiverId, employeeReceiverId: senderId},
		],
	  },
	  include: {employeeSender: true, companyReceiver: true, media: true},
	  orderBy: {createdAt: 'asc'},
	});
	return res.json(chats);
  };
  export const getCompanyMessage = async (req: Request, res: Response, next: NextFunction) => {
	const senderId = (req as any).user.company;
	const receiverId = req.params.id;
	const chats = await prisma.companyAndEmployeeMessage.findMany({
	  where: {
		OR: [
		  {companySenderId: senderId, employeeReceiverId: receiverId},
		  {employeeSenderId: receiverId, companyReceiverId: senderId},
		],
	  },
	  include: {companySender: true, employeeReceiver: true, media: true},
	  orderBy: {createdAt: 'asc'},
	});
	return res.json(chats);
  };
  export const findOrCreateIfNotExistToCompany = async (participants: string[]) => {
	const [employee, company] = participants;
	let room = await prisma.companyAndEmployeeRoom.findFirst({
	  where: {
		participants: {
		  every: {
			employeeId: employee,
			companyId: company,
		  },
		},
	  },
	  include: {participants: true},
	});
	console.log('🚀 ~ findOrCreateIfNotExistToCompany ~ room:', room);
	if (!room) {
	  console.log('haha');
	  room = await prisma.companyAndEmployeeRoom.create({
		data: {
		  participants: {
			create: [{employeeId: employee}, {companyId: company}],
		  },
		},
		include: {participants: true},
	  });
	  console.log('🚀 ~ findOrCreateIfNotExistToCompany ~ room:', room);
	}
  
	return room;
  };
  export const findOrCreateIfNotExistToEmployee = async (participants: string[]) => {
	const [company, employee] = participants;
	let room = await prisma.companyAndEmployeeRoom.findFirst({
	  where: {
		participants: {
		  every: {
			AND: [{employeeId: employee}, {companyId: company}],
		  },
		},
	  },
	  include: {participants: true},
	});
	console.log('🚀 ~ findOrCreateIfNotExistToEmployee ~ room:', room);
	if (!room) {
	  console.log('haha');
	  room = await prisma.companyAndEmployeeRoom.create({
		data: {
		  participants: {
			create: [{employeeId: employee}, {companyId: company}],
		  },
		},
		include: {participants: true},
	  });
	  console.log('🚀 ~ findOrCreateIfNotExistToEmployee ~ room:', room);
	}
	return room;
  };
  export const getCompanyForSideBarDown = async (req: Request, res: Response, next: NextFunction) => {
	try {
	  const authEmployeeId = (req as any).user.employeeId;
	  const companyId = (req as any).user.companyId;
  
	  // Fetch all companies except the one the user is part of
	  const companies = await prisma.company.findMany({
		where: {
		  companyId,
		},
		select: {
		  companyId: true,
		  companyName: true,
		},
	  });
  
	  // Fetch recent messages and unread count for each company
	  const companiesWithMessages = await Promise.all(
		companies.map(async (company) => {
		  // Get recent message
		  const recentMessage = await prisma.companyAndEmployeeMessage.findFirst({
			where: {
			  OR: [
				{employeeSenderId: authEmployeeId, companyReceiverId: company.companyId},
				{companySenderId: company.companyId, employeeReceiverId: authEmployeeId},
			  ],
			},
			orderBy: {createdAt: 'desc'},
			include: {employeeSender: true, companyReceiver: true},
		  });
  
		  // Count unread messages
		  const unreadCount = await prisma.companyAndEmployeeMessage.count({
			where: {
			  employeeReceiverId: authEmployeeId,
			  companySenderId: company.companyId,
			  read: false,
			},
		  });
  
		  return {
			...company,
			recentMessage,
			unreadCount,
		  };
		}),
	  );
  
	  res.status(200).json(companiesWithMessages);
	} catch (error: any) {
	  console.error('Error in getCompanyForSideBarDown: ', error.message);
	  res.status(500).json({error: 'Internal server error'});
	}
  };
  
  export const getEmployeeForSideBarDown = async (
	req: Request,
	res: Response,
	next: NextFunction,
  ) => {
	console.log('ya aayos');
	try {
	  const authCompanyId = (req as any).user.companyId;
	  console.log('🚀 ~ getEmployeeForSideBarDown ~ authCompanyId:', authCompanyId);
	  console.log('🚀 ~ getEmployeeForSideBarDown ~ authCompanyId:', authCompanyId);
	  // Fetch all employees belonging to the company
	  const employees = await prisma.employee.findMany({
		where: {
		  companyId: authCompanyId,
		},
		select: {
		  employeeId: true,
		  employeeName: true,
		},
	  });
	  // Fetch recent messages and unread count for each employee
	  const employeesWithMessages = await Promise.all(
		employees.map(async (employee) => {
		  // Get recent message
		  const recentMessage = await prisma.companyAndEmployeeMessage.findFirst({
			where: {
			  OR: [
				{companySenderId: authCompanyId, employeeReceiverId: employee.employeeId},
				{employeeSenderId: employee.employeeId, companyReceiverId: authCompanyId},
			  ],
			},
			orderBy: {createdAt: 'desc'},
			include: {companySender: true, employeeReceiver: true},
		  });
  
		  // Count unread messages
		  const unreadCount = await prisma.companyAndEmployeeMessage.count({
			where: {
			  employeeSenderId: employee.employeeId,
			  companyReceiverId: authCompanyId,
			  read: false,
			},
		  });
  
		  return {
			...employee,
			recentMessage,
			unreadCount,
		  };
		}),
	  );
  
	  res.status(200).json(employeesWithMessages);
	} catch (error: any) {
	  console.error('Error in getEmployeeForSideBarDown: ', error.message);
	  res.status(500).json({error: 'Internal server error'});
	}
  };
  
  export const createRoom = async (req: Request, res: Response) => {
	const {roomName, employeeIds, companyIds} = req.body;
	try {
	  const room = await prisma.companyAndEmployeeRoom.create({
		data: {
		  name: roomName,
		  participants: {
			create: [
			  ...employeeIds.map((employeeId: any) => ({
				employee: {
				  connect: {employeeId},
				},
			  })),
			  ...companyIds.map((companyId: any) => ({
				company: {
				  connect: {companyId},
				},
			  })),
			],
		  },
		},
	  });
	  res.status(200).json({message: 'participants are added to the room successfully', room});
	} catch (error) {
	  console.error('Error creating room:', error);
	  res.status(500).json({error: 'Error creating room'});
	}
  };
  export const addParticipantsToRoom = async (req: Request, res: Response) => {
	const {roomId, employeeIds, companyIds} = req.body;
	try {
	  const roomParticipants = await prisma.roomParticipant.createMany({
		data: [
		  ...employeeIds.map((employeeId: any) => ({
			roomId,
			employeeId,
		  })),
		  ...companyIds.map((companyId: any) => ({
			roomId,
			companyId,
		  })),
		],
	  });
	} catch (error) {
	  console.log('🚀 ~ addParticipantsToRoom ~ error:', error);
	}
  };
  
  export const getGroupMessages = async (req: Request, res: Response) => {
	const roomId = req.params.id;
	console.log('🚀 ~ getGroupMessages ~ roomId:', roomId);
	const room = await prisma.companyAndEmployeeRoom.findUnique({
	  where: {
		id: roomId,
	  },
	});
	if (!room) {
	  return res.status(404).json({message: 'Room not found'});
	}
	const messages = await prisma.companyAndEmployeeMessage.findMany({
	  where: {roomId},
	  include: {
		employeeSender: {
		  select: {employeeName: true},
		},
		companySender: {
		  select: {companyName: true},
		},
		media: true,
	  },
	  orderBy: {
		createdAt: 'asc',
	  },
	});
	return res.status(200).json({
	  roomId: roomId,
	  roomName: room.name,
	  messages: messages.map((message) => ({
		id: message.id,
		content: message.content,
		sender: message.employeeSender
		  ? message.employeeSender.employeeName
		  : message.companySender
			? message.companySender.companyName
			: 'Unknown sender',
		createdAt: message.createdAt,
		read: message.read,
		media: message.media,
	  })),
	});
  };
  
  export const sendMessageToRoom = async (req: Request, res: Response) => {
	const uploadedFiles = Array.isArray(req.files)
	  ? req.files.map((file) => ({
		  name: file.originalname,
		  filePath: `http://localhost:8000/uploads/message/${file.filename}`,
		  mimeType: file.mimetype,
		}))
	  : [];
	console.log('🚀 ~ uploadedFiles ~ uploadedFiles:', uploadedFiles);
	const roomId = req.params.id;
	console.log('🚀 ~ sendMessageToRoom ~ roomId:', roomId);
	const {senderId, content, isCompany} = req.body;
	console.log('🚀 ~ sendMessageToRoom ~ isCompany:', isCompany);
	console.log('🚀 ~ sendMessageToRoom ~ content:', content);
	console.log('🚀 ~ sendMessageToRoom ~ senderId:', senderId);
	if (!roomId || !senderId) {
	  return res.status(400).json({message: 'Missing Required Fields.'});
	}
	const room = await prisma.companyAndEmployeeRoom.findUnique({
	  where: {id: roomId},
	});
	if (!room) {
	  return res.status(404).json({message: 'Room not Found'});
	}
	let messageData: any = {
	  content,
	  room: {
		connect: {id: roomId},
	  },
	  media: {
		create: uploadedFiles,
	  },
	};
	if (isCompany) {
	  console.log('ya xiro');
	  const company = await prisma.company.findUnique({
		where: {companyId: senderId},
	  });
	  if (!company) {
		return res.status(404).json({message: 'Company not found.'});
	  }
	  messageData.companySender = {connect: {companyId: senderId}};
	} else {
	  console.log('ya xiro1');
  
	  const employee = await prisma.employee.findUnique({
		where: {
		  employeeId: senderId,
		},
	  });
	  if (!employee) {
		return res.status(404).json({message: 'Employee not found.'});
	  }
	  messageData.employeeSender = {connect: {employeeId: senderId}}; // Update here
	}
	console.log('haha');
	const newMessage = await prisma.companyAndEmployeeMessage.create({
	  data: messageData,
	  include: {
		media: true, // Include media in response
	  },
	});
	console.log('🚀 ~ sendMessageToRoom ~ newMessage:', newMessage);
	io.to(room.id).emit('roomMessage', newMessage);
	return res.status(201).json({
	  message: 'Message sent successfully.',
	  newMessage,
	});
  };
  export const createGroup = async (req: Request, res: Response) => {
	const {name, participants} = req.body;
	console.log('🚀 ~ createGroup ~ participants:', participants);
	console.log('🚀 ~ createGroup ~ name:', name);
	if (!name || !participants || participants.length === 0) {
	  return res.status(400).json({message: 'Group name and participants are required.'});
	}
	const newRoom = await prisma.companyAndEmployeeRoom.create({
	  data: {
		name,
	  },
	});
	const roomParticipants = await Promise.all(
	  participants.map(async (participant: any) => {
		const {employeeId, companyId} = participant;
		if (employeeId) {
		  const employeeExists = await prisma.employee.findUnique({
			where: {
			  employeeId,
			},
		  });
		  if (!employeeExists) {
			throw new Error(`Employee with ID${employeeId} does not exists`);
		  }
		  return await prisma.roomParticipant.create({
			data: {
			  roomId: newRoom.id,
			  employeeId,
			},
		  });
		} else if (companyId) {
		  const companyExists = await prisma.company.findUnique({
			where: {companyId},
		  });
		  if (!companyExists) {
			throw new Error(`company with ID ${companyId} does not exist.`);
		  }
		  return await prisma.roomParticipant.create({
			data: {
			  roomId: newRoom.id,
			  companyId,
			},
		  });
		} else {
		  throw new Error(`Participants must have either an employeeId or companyId.`);
		}
	  }),
	);
	return res.status(201).json({
	  message: 'Group Created Successfully',
	  room: newRoom,
	  participants: roomParticipants,
	});
  };
  export const getAllRoomForEmployee = async (req: Request, res: Response) => {
	try {
	  console.log('ya ta aayo?');
	  const employeeId = (req as any).user.employeeId;
	  console.log('🚀 ~ getAllRoomForEmployee ~ employeeId:', employeeId);
	  console.log('🚀 ~ getAllRoomForEmployee ~ employeeId:', employeeId);
	  let rooms: any;
	  if (employeeId) {
		rooms = await prisma.companyAndEmployeeRoom.findMany({
		  where: {
			participants: {
			  some: {
				employeeId,
			  },
			},
			name: {
			  not: '',
			},
		  },
  
		  select: {
			id: true,
			name: true,
		  },
		});
	  }
	  if (rooms.length === 0) {
		return res.status(404).json({message: 'No rooms found for this user'});
	  }
	  return res.status(200).json({
		message: 'Rooms fetched successfully',
		rooms,
	  });
	} catch (error) {
	  console.log('🚀 ~ getAllRoomForEmployee ~ error:', error);
	}
  };
  
  export const getAllRoomForCompany = async (req: Request, res: Response) => {
	try {
	  const companyId = (req as any).user.companyId;
	  console.log('🚀 ~ getAllRoomForCompany ~ companyId:', companyId);
	  let rooms: any;
	  if (companyId) {
		rooms = await prisma.companyAndEmployeeRoom.findMany({
		  where: {
			participants: {
			  some: {
				companyId,
			  },
			},
			name: {
			  not: '',
			},
		  },
		  select: {id: true, name: true},
		});
	  }
	  if (rooms.length === 0) {
		return res.status(404).json({message: 'No rooms For this user'});
	  }
	  return res.status(200).json({
		message: 'Rooms fetched Successfully',
		rooms,
	  });
	} catch (error) {
	  console.log('🚀 ~ getAllRoomForCompany ~ error:', error);
	}
  };
  
  export const displayUsersToAddInGroup = async (req: Request, res: Response) => {
	const authUserId = (req as any).user.employeeId;
	console.log('🚀 ~ displayUsersToAddInGroup ~ authUserId:', authUserId);
	const companyId = (req as any).user.companyId;
	console.log('🚀 ~ displayUsersToAddInGroup ~ companyId:', companyId);
	// Fetch users belonging to the same company
	const users = await prisma.employee.findMany({
	  where: {
		companyId,
	  },
	  select: {
		employeeId: true,
		employeeName: true,
	  },
	});
	// Fetch only the company id and name for the authenticated user
	const company = await prisma.employee.findUnique({
	  where: {
		employeeId: authUserId,
	  },
	  select: {
		company: {
		  select: {
			companyId: true,
			companyName: true,
		  },
		},
	  },
	});
	return res.status(200).json({
	  users,
	  company: company?.company, // Accessing the company directly
	});
  };
  export const displayUsersToAddInGroupForCompany = async (req: Request, res: Response) => {
	const companyId = (req as any).user.companyId;
	const users = await prisma.employee.findMany({
	  where: {
		companyId,
	  },
	  select: {
		employeeId: true,
		employeeName: true,
	  },
	});
	const company = await prisma.company.findUnique({
	  where: {
		companyId,
	  },
	  select: {
		companyId: true,
		companyName: true,
	  },
	});
	return res.status(200).json({
	  users,
	  company, // Accessing the company directly
	});
  };
  