const requireTenant = (req, res, next) => {
  const tenant = req.admin?.tenant;
  if (!tenant) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Tenant context is required for fiscal operations.',
      code: 'TENANT_CONTEXT_REQUIRED',
    });
  }

  req.tenantId = String(tenant._id || tenant);
  return next();
};

module.exports = requireTenant;
