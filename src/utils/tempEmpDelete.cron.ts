// import cron from 'node-cron';
// import prisma from '../models/index.js';
// export const cronService=()=>{
//     console.log('haha')
//     cron.schedule('0 0 1 * *',async()=>{
//         console.log('haha1')
//         try{    
//             const deletedEmployees = await prisma.employeeTemp.deleteMany({})
    
//         }catch(error){
//             console.error('error deleting temp employees',error)
//         }
//     })
// }