module.exports = function (data) {
  return Object.assign(data, {
    createdAt: Date.now(),
    updatedAt: Date.now()
  })
}
