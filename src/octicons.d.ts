declare module "@primer/octicons" {
  const icons: Record<
    string,
    {
      heights: Record<
        string,
        {
          width: number;
          ast: {
            children: { name: string; attributes: Record<string, string> }[];
          };
        }
      >;
    }
  >;
  export default icons;
}
