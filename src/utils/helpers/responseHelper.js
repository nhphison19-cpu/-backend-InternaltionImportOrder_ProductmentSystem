function success(res, { statusCode = 200, message = 'Success', data = null, meta = null }) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== null ? { data } : {}),
    ...(meta !== null ? { meta } : {}),
  });
}

function created(res, { message = 'Created successfully', data = null }) {
  return success(res, { statusCode: 201, message, data });
}

function paginated(res, { message = 'Success', data, page, limit, total }) {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
function sendError (res , {statusCode = 500 , message = 'Error'  }) {
return res.status(statusCode ).json({success : false , message })
}
module.exports = { success, created, paginated  , sendError};