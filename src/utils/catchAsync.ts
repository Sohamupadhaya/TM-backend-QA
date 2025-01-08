// for catching async try catch error
export const catchAsync = (fn:any) => {
    return (req:any, res:any, next:any) => {
      fn(req, res, next).catch((err:any) => {
        next(err);
      });
    };
  };
  