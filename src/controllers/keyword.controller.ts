import prisma from '../models/index.js';
import {Request, NextFunction, Response} from 'express';



// export async function captureAndExtractText(req: Request, res: Response, next: NextFunction) {
//   const companyId = (req as any).user.companyId; // Assuming user object has companyId


//   // Fetch keywords from Redis
//   let keyword;
//   try {
//     keyword = await redisClient.get('keywords');
//     console.log("🚀 ~ captureAndExtractText ~ keyword:", keyword);
//   } catch (getError) {
//     console.error("Error fetching keywords from Redis:", getError);
//     return next(customErrorHandler(res, "Internal Server Error", 500));
//   }
//   let getAllKeywords;
//   if (keyword != null) {
//     getAllKeywords = JSON.parse(keyword);
//   } else {
//     console.log('No keywords found in Redis, fetching from database...');
//     try {
//       getAllKeywords = await prisma.keyword.findMany({
//         where: { companyId },
//       });
//       console.log('Fetched keywords from DB:', getAllKeywords);
//       await redisClient.set("test-key", "Test value");

//       await redisClient.set('keywords', JSON.stringify(getAllKeywords));
//       const cachedKeywords = await redisClient.get('keywords');

//       console.log('Cached keywords:', cachedKeywords);  // Ensure it's correctly stored

//     } catch (dbError) {
//       console.error("Error fetching keywords from database:", dbError);
//       return next(customErrorHandler(res, "Internal Server Error", 500));
//     }
//   }
//   const keywords = getAllKeywords.map((item: any) => item.keyword);

//   // Capture screenshot and perform OCR
//   screenshot({ format: 'png' })
//     .then(async (img: any) => {
//       const filePath = `screenshot-${Date.now()}.png`;
//       const metadata = await sharp(img).metadata();

//       const newWidth = Math.round(metadata.width! * 0.85);
//       const newHeight = Math.round(metadata.height! * 0.85);
      
//       await sharp(img)
//         .resize({ width: newWidth, height: newHeight })
//         .toFile(filePath);

//       // Perform OCR on the image
//       Tesseract.recognize(filePath, 'eng', {})
//         .then(async ({ data: { text } }) => {
//           console.log('Extracted text:', text);
//           fs.unlinkSync(filePath);
//           const matchingKeywords = keywords.filter((keyword: string) => text.includes(keyword));
//           if (matchingKeywords.length > 0) {
//             console.log('Matching Keywords:', matchingKeywords);
//             const employee = await prisma.employee.findUnique({
//               where: { employeeId },
//             });
//             if (!employee) {
//               return next(customErrorHandler(res, 'Employee not found:', 404));
//             }
//             const existingRiskUser = await prisma.riskUser.findFirst({
//               where: {
//                 employeeId,
//                 companyId,
//               },
//             });
//             if (existingRiskUser) {
//               return next(customErrorHandler(res, 'Employee already exists in RiskUser.', 404));
//             }
//             await prisma.riskUser.create({
//               data: {
//                 employeeId,
//                 employeeName: employee.employeeName,
//                 departmentId: employee.departmentId,
//                 companyId,
//                 isSafe: false,
//               },
//             });
//           } else {
//             console.log('No matching keywords found..');
//           }
//           res.status(200).json({ message: 'Successfully checked keyword' });
//         })
//         .catch((err) => {
//           console.error('Error in Tesseract OCR:', err);
//           res.status(500).json({ message: 'OCR error occurred' });
//         });
//     })
//     .catch((err: any) => {
//       console.error('Error during screenshot capture:', err);
//       res.status(500).json({ message: 'Screenshot capture error occurred' });
//     });
// }

export const addKeyWords = async (req: Request, res: Response, next: NextFunction) => {
  const companyId = (req as any).user.companyId; // Assuming user object has companyId
  console.log('🚀 ~ addKeyWords ~ companyId:', companyId);
  const {keyword} = req.body; // Destructure keywords from request body
  // Check for companyId and keywords
  if (!companyId) {
    return res.status(400).json({error: 'Failed to save keywords'});
  }
  try {
    const save = await prisma.keyword.create({
      data: {
        companyId,
        keyword,
      },
    });
    return res.status(201).json({message: 'Keywords added successfully', data: save});
  } catch (error) {
    console.error('Error saving keywords:', error);
    return res.status(500).json({error: 'Failed to save keywords'});
  }
};


export const getAllKeywords = async (req: Request, res: Response, next: NextFunction) => {
  const companyId = (req as any).user.companyId;
  console.log('🚀 ~ getAllKeywords ~ companyId:', companyId);
  if (!companyId) {
    return res.status(400).json({error: 'Please login as company'});
  }
  try {
    const getAllKeywords = await prisma.keyword.findMany({
      where: {
        companyId,
      },
    });
    return res.status(201).json({data: getAllKeywords});
  } catch (err) {
    return res.status(400).json({error: 'Internal server errror'});
  }
};


export const getAllKeywordsForEmployee = async(req:Request,res:Response,next:NextFunction)=>
  {
  const employee = (req as any).user;
  console.log("🚀 ~ getAllKeywordsForEmployee ~ employee:", employee)
  try{
    const getAllKeywords=await prisma.keyword.findMany({
      where:{
        companyId:employee.companyId
      }
    });
    return res.status(201).json({data:getAllKeywords})
  }catch(err){
    return res.status(400).json({error:'Internal server errror'});
  }
}


export const deleteKeyword = async (req: Request, res: Response) => {
  const {id} = req.body;
  console.log('🚀 ~ deleteKeyword ~ id:', id);
  if (!id) {
    return res.status(400).json({error: 'Please give a valid keyword ID '});
  }
  try {
    const deleteKeyword = await prisma.keyword.delete({
      where: {
        KeywordId: id,
      },
    });
    console.log('🚀 ~ deleteKeyword ~ deleteKeyword:', deleteKeyword);
    return res.status(200).json({message: 'successfully deleted keyword'});
  } catch (error) {
    return res.status(400).json({error: error});
  }
};


export const updateKeyword = async (req: Request, res: Response) => {
  const {id, keyword} = req.body;
  console.log('🚀 ~ updateKeyword ~ keyword:', keyword);
  console.log('🚀 ~ updateKeyword ~ id:', id);
  if (!id || !keyword) {
    return res.status(400).json({error: 'Please fill all the field.'});
  }
  const checkForId = await prisma.keyword.findUnique({
    where: {
      KeywordId: id,
    },
  });
  if (!checkForId) {
    return res.status(400).json({error: 'Id Not found.'});
  }
  try {
    const updateKeyword = await prisma.keyword.update({
      data: {
        keyword,
      },
      where: {
        KeywordId: id,
      },
    });
    return res.status(200).json({message: 'Successfully updated Keyword'});
  } catch (error) {
    console.log('🚀 ~ updateKeyword ~ error:', error);
    return res.status(400).json({message: 'Internal server Error'});
  }
};



export const foundKeyword = async (req: Request, res: Response) => {
  console.log('-----------------------------------found keyword--------------------------------');
  const employee = (req as any).user;
  const companyId = employee.companyId;
  const { keyword } = req.body;

  if (!keyword || !employee) {
    return res.status(400).json({ message: "Keyword or employee data is missing." });
  }

  // Check if the employee is already in the RiskUser table
  const alreadyRiskUser = await prisma.riskUser.findUnique({
    where: {
      employeeId: employee.employeeId,
    },
  });

  if (alreadyRiskUser) {
    console.log("🚀 ~ foundKeyword ~ alreadyRiskUser:", alreadyRiskUser);
    return res.status(400).json({ message: "Employee is already a risk user." });
  }

  // Check if the keyword count for this employee exists and increment if so
  const checkIfKeywordFoundEmployee = await prisma.keywordFoundEmployee.findUnique({
    where: {
      employeeId: employee.employeeId,
    },
  });

  if (checkIfKeywordFoundEmployee) {
    // If the count reaches 7 after incrementing, add employee to the RiskUser table
    if (checkIfKeywordFoundEmployee.count >= 6) {
      await prisma.riskUser.create({
        data: {
          employeeId: employee.employeeId,
          employeeName: employee.employeeName, // Adjust based on actual employee name field
          companyId: companyId,
          isSafe: false,
        },
      });
      return res.status(200).json({ message: "Employee added to risk user list." });
    }

    // Otherwise, increment the count
    await prisma.keywordFoundEmployee.update({
      where: {
        employeeKeywordId: checkIfKeywordFoundEmployee.employeeKeywordId,
      },
      data: {
        count: {
          increment: 1,
        },
      },
    });
    return res.status(200).json({ message: "Keyword count incremented." });
  } else {
    // If no keyword count exists for the employee, create a new entry
    await prisma.keywordFoundEmployee.create({
      data: {
        employeeId: employee.employeeId,
        keywords: keyword,
        count: 1,
      },
    });
    return res.status(200).json({ message: "Employee keyword added." });
  }
};