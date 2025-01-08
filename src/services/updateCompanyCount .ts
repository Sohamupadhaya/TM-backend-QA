import prisma from "../models/index.js";

export const updateCompanyDepartmentsCount = async (companyId: string) => {
    const noOfDepartments = await prisma.department.count({
      where: { companyId },
    });
  
    await prisma.company.update({
      where: { companyId },
      data: { noOfDepartments },
    });
};

export const updateCompanyTeamsCount = async(companyId:string)=>{
  const noOfTeams = await prisma.team.count({
    where: { companyId },
  });

  await prisma.company.update({
    where: { companyId },
    data: { noOfTeams },
  });
}

export const updateDeartmentTeamsCount = async(departmentId:string)=>{
  const noOfTeams = await prisma.team.count({
    where: { departmentId },
  });

  await prisma.department.update({
    where: { departmentId },
    data: { noOfTeams },
  });
}

export const updateCompanyEmployeeCount = async(companyId:string)=>{
  const noOfEmployees = await prisma.employee.count({
    where:{
      companyId,
      isActive:true
    }
  })

  await prisma.company.update({
    where:{companyId},
    data:{noOfEmployees}
  })
}

export const updateTeamEmployeeCount = async(teamId:string)=>{
  const noOfEmployees = await prisma.employee.count({
    where:{
      teamId,
      isActive:true
    }
  })
  await prisma.team.update({
    where:{
      teamId
    },
    data:{
      noOfEmployee:noOfEmployees
    }
  })
}


// export const updateDepartmentEmployeeCount = async(departmentId:string)=>{
//   const noOfEmployees = await prisma.employee.count({
//     where:{
//       departmentId,
//       isActive:true
//     }
//   })

//   await prisma.department.update({
//     where:{departmentId},
//     data:{}
//   })
// }