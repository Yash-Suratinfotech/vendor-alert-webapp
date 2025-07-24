import emitter from "./eventBus";

const convertArrayToObject = (array, key) => {
  const initialValue = {};
  return array.reduce((obj, item) => {
    return {
      ...obj,
      [item[key]]: item,
    };
  }, initialValue);
};

export const redirectLoginPage = (redirect) => {
  if (redirect) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    emitter.emit("error", {
      message: "User is Unauthorized !!",
      type: "alert-danger",
    });
    return (window.location.href = "/login");
  }
};

const errorHandler = (error) => {
  console.log("✌️errorHandler --->", error);

  const showErrorMessage = (m) => {
    m?.length > 0 &&
      emitter.emit("error", {
        message: m,
        type: "alert-danger",
      });
  };

  if (error?.response) {
    const { status } = error.response;
    switch (status) {
      case 500:
        if (error?.response?.data?.message || error?.response?.data?.error) {
          showErrorMessage(
            error?.response?.data?.message || error?.response?.data?.error
          );
        } else {
          showErrorMessage("Internal server error !!");
        }
        // redirectLoginPage(true);
        break;
      case 404:
        if (error?.response?.data?.message || error?.response?.data?.error) {
          showErrorMessage(
            error?.response?.data?.message || error?.response?.data?.error
          );
        } else {
          showErrorMessage("404 : Page Not Found !!");
        }
        break;
      case 413:
        showErrorMessage("File size too large !!");
        break;
      case 401:
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showErrorMessage(
          error?.response?.data?.message || "User is Unauthorized !!"
        );
        window.location.reload();
        break;
      case 400:
        if (error?.response?.data?.message || error?.response?.data?.error) {
          showErrorMessage(
            error?.response?.data?.message || error?.response?.data?.error
          );
        } else {
          showErrorMessage("Bad request !!");
        }
        break;
      case 406:
        if (error?.response?.data?.message || error?.response?.data?.error) {
          showErrorMessage(
            error?.response?.data?.message || error?.response?.data?.error
          );
        } else {
          showErrorMessage("Bad request !!");
        }
        break;
      default:
        var response = (error) => {
          if (Array.isArray(error)) {
            return convertArrayToObject(error);
          } else {
            return error;
          }
        };
        Object.values(response).forEach(
          (msg) => msg?.length > 0 && showErrorMessage(msg)
        );
    }
  } else if (error?.networkError) {
    const errorMessage =
      error.networkError?.statusCode === 500
        ? "Internal server error! Please try again later."
        : "An unexpected error occurred. Please check your network connection and try again.";
    showErrorMessage(errorMessage);
    if (error.networkError?.statusCode === 500) redirectLoginPage(true);
  } else if (error[0]?.message) {
    if (error[0]?.message === "You are not authorized") {
      redirectLoginPage(true);
    } else {
      showErrorMessage(error[0]?.message);
    }
  } else if (error[0]?.extensions) {
    showErrorMessage(error[0]?.extensions?.error[0]?.message);
  } else {
    showErrorMessage("Something went wrong !!");
  }
};

export default errorHandler;
