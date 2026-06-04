
import ContentLoader from "react-content-loader"


function CodeLoader(props) {
  return (
    <ContentLoader
      speed={2}
      width={400}
      height={160}
      viewBox="0 0 400 160"
      backgroundColor="#f3f3f3"
      foregroundColor="#ecebeb"
      {...props}
    >
      <rect x="0" y="0" rx="3" ry="3" width="400" height="20" />
      <rect x="0" y="30" rx="3" ry="3" width="400" height="10" />
      <rect x="0" y="50" rx="3" ry="3" width="400" height="10" />
      <rect x="0" y="70" rx="3" ry="3" width="400" height="10" />
      <rect x="0" y="0" rx="3" ry="3" width="400" height="20" />
      <rect x="0" y="30" rx="3" ry="3" width="400" height="10" />
      <rect x="0" y="50" rx="3" ry="3" width="400" height="10" />
      <rect x="0" y="70" rx="3" ry="3" width="400" height="10" />
    </ContentLoader>
  );
}

export default CodeLoader;