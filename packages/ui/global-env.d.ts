declare module "*.module.scss" {
  const classes: Record<string, string>;

  // eslint-disable-next-line import/no-default-export -- scss modules are default exports
  export default classes;
}
