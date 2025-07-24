function convertToNestedTree(flatTree) {
  const root = [];
  const pathMap = {};

  flatTree.forEach((item, index) => {
    const parts = item.path.split("/");
    const name = parts.pop();
    const id = item.path;
    const node = { id, name };

    if (item.type === "tree") node.children = [];

    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const path = parts.slice(0, i + 1).join("/");
      if (!pathMap[path]) {
        pathMap[path] = {
          id: path,
          name: parts[i],
          children: [],
        };
        currentLevel.push(pathMap[path]);
      }
      currentLevel = pathMap[path].children;
    }

    if (parts.length === 0) {
      root.push(node);
    } else {
      const parentPath = parts.join("/");
      pathMap[parentPath].children.push(node);
    }

    pathMap[item.path] = node;
  });

  return root;
}

export default convertToNestedTree;