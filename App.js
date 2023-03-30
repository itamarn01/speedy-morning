import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  ScrollView,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
} from "react-native";
import moment from "moment";
import Toast from "react-native-root-toast";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import XLSX from "xlsx";
import axios from "axios";

function App() {
  const fileInputRef = useRef();
  const rotation = useRef(new Animated.Value(0)).current;
  const [titleData, setTitleData] = useState();
  const [sheetData, setSheetData] = useState([]);
  const [token, setToken] = useState();
  const today = new Date().toISOString().slice(0, 10);
  const [formattedDate, setFormattedDate] = useState("");
  const [showText, setShowText] = useState(true);
  const [description, setDescription] = useState("");
  const [isLoadingBtn, setIsLoadingBtn] = useState(Array(200).fill(false));
  const [isLoading, setIsLoading] = useState(false);
  const [documentSuccessArray, setdocumentSuccessArray] = useState(
    Array(200).fill(false)
  );
  /* const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [mobile, setMobile] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));*/
  let Url = "https://sandbox.d.greeninvoice.co.il";
  const getToken = async () => {
    try {
      const response = await axios.post(
        `${Url}/api/v1/account/token`,
        {
          id: "b0a670ff-cd15-4a9c-b7cb-d830478e6443",
          secret: "KkIhGh3hYoVTmvG1xXD0kw",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      //  console.log(JSON.stringify(response.data.token));
      setToken(response.data.token);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getToken();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleAddDocument = (
    date,
    name,
    type,
    mobile,
    price,
    desTitle,
    description,
    index
  ) => {
    const loadingBtn = [...isLoadingBtn];
    const fixDate = new Date(date);
    const formattedCell = `${fixDate.getDate()}/${
      fixDate.getMonth() + 1
    }/${fixDate.getFullYear()}`;
    let phone = mobile.toString();
    let eventType = type.toString();
    loadingBtn[index] = true;
    setIsLoadingBtn(loadingBtn);
    const documentDone = [...documentSuccessArray];
    console.log(
      "date: ",
      date,
      "name: ",
      name,
      "type: ",
      type,
      "mobile: ",
      phone,
      "price:",
      price,
      "desTitle:",
      desTitle,
      "description:",
      description
    );
    let data = JSON.stringify({
      type: 305,
      date: date,
      vatType: 0,
      lang: "en",
      currency: "ILS",
      description: desTitle
        ? desTitle
        : eventType === "צוות 1"
        ? `שירותי מוזיקה לחתונה בתאריך ${formattedCell}`
        : `נגינה בחתונה בתאריך ${formattedCell} `,
      //remarks: "חשבונית מס / קבלה עבור תעודת משלוח 32",
      footer: "נשמח לעמוד לשרותכם",
      emailContent: "",
      client: {
        name: name,
        self: false,
        emails: [""],
        phone:
          phone.length > 0
            ? `0${phone.substring(0, 2)}-${phone.slice(-7)}`
            : null,
      },
      rounding: false,
      signed: true,
      income: [
        {
          catalogNum: "",
          description: description
            ? description
            : eventType === "צוות 1"
            ? `שירותי מוזיקה לחתונה `
            : `נגינה בחתונה - עד 4.5 שעות`,
          quantity: 1,
          price: price,
          initialPrice: 0,
          amount: price,
          currency: "ILS",
          currencyRate: 1,
          vatRate: 0.17,
          vatType: 1,
        },
      ],
      /* payment: [
        {
          type: 4,
          price: price,
          currency: "ILS",
          currencyRate: 1,
          date: today,
        },
      ],*/
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://sandbox.d.greeninvoice.co.il/api/v1/documents",
      headers: {
        Authorization: `Bearer ${token} `,
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        documentDone[index] = !documentDone[index];
        setdocumentSuccessArray(documentDone);
        loadingBtn[index] = false;
        setIsLoadingBtn(loadingBtn);
        Toast.show("חשבונית הופקה בהצלחה", {
          duration: Toast.durations.LONG,
          position: 80,
          shadow: true,
          animation: true,
          hideOnPress: true,
          delay: 0,
        });
      })
      .catch((error) => {
        console.log(error);
        loadingBtn[index] = false;
        setIsLoadingBtn(loadingBtn);
        Toast.show("תאריך מאוחר או מוקדם או בעיה בשדות", {
          duration: Toast.durations.LONG,
          position: 80,
          shadow: true,
          animation: true,
          hideOnPress: true,
          delay: 0,
        });
        documentDone[index] = false;
        setdocumentSuccessArray(documentDone);
      })
      .finally(() => {
        loadingBtn[index] = false;
        setIsLoadingBtn(loadingBtn);
      });
  };

  function convertDateFormat(dateString) {
    const parts = dateString.split("/");
    const year = parts[2];
    const month = parts[1].padStart(2, "0");
    const day = parts[0].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const handleUpload = async () => {
    try {
      setIsLoading(true);
      const file = await DocumentPicker.getDocumentAsync({
        type: "*/*",
      });
      const { uri } = file;

      // Fetch the file and read it as a Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Convert the Blob to a base64-encoded string
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result.replace(/^data:.+;base64,/, "");
        const workbook = XLSX.read(base64data, { type: "base64" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const range = XLSX.utils.decode_range("A0:L200");
        // Convert all date cells to date objects
        const sheetData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          cellDates: true,
          range: range,
        });
        // Format date cells to 'DD/MM/YYYY'
        const formattedSheetData = sheetData.map((row) => {
          return row.map((cell) => {
            if (cell >= 44000 && cell < 46000) {
              const milliseconds = (cell - 25569) * 86400 * 1000;
              const date = new Date(milliseconds);
              const formattedCell = `${date.getDate()}/${
                date.getMonth() + 1
              }/${date.getFullYear()}`;
              return formattedCell;
            } else {
              return cell;
            }
          });
        });
        setSheetData(formattedSheetData);
      };
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
      setShowText(false);
    }
  };

  const renderItem = ({ item, index }) => {
    const isHeaderRow = index === 0;

    return (
      <View style={styles.rowContainer}>
        <View style={{ flex: 0.7 }}>
          <ScrollView horizontal>
            <View style={[styles.row, { flexWrap: "nowrap" }]}>
              {item.map((cell, cellIndex) => (
                <View
                  key={cellIndex}
                  style={isHeaderRow ? styles.headerCell : styles.cell}
                >
                  <Text>{cell}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
        {!isHeaderRow && (
          <TouchableOpacity
            style={{
              flex: 0.3,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={handleAddDocument(
              convertDateFormat(sheetData[index][0]),
              sheetData[index][1],
              sheetData[index][5],
              sheetData[t][8]
            )}
          >
            <Text>הפק חשבונית</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const keyExtractor = (item, index) => index.toString();

  // console.log("ma hamazv");
  // console.log("sheetData:", sheetData);
  return (
    <View
      style={{
        flex: 1,
        // paddingTop: 100,
        backgroundColor: "rgba(247, 34, 133, 0.2)",
      }}
    >
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
          paddingTop: 50,
        }}
      >
        <Image
          source={require("./assets/logo.png")}
          style={{ width: 200, height: 100 }}
        />
      </View>
      <Text
        style={{
          alignSelf: "center",
          color: "green",
          writingDirection: "rtl",
          marginHorizontal: 10,
          marginVertical: 10,
        }}
      >
        {token ? "מחובר לחשבון שלך" : "מתחבר לחשבונית ירוקה.."}
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          width: "100%",
        }}
      >
        <Button title="חדש חיבור לחשבון שלך" onPress={getToken} />
        <Button title="מסמך חדש" onPress={handleUpload} />
      </View>

      {/*sheetData.length > 0 && (
        <ScrollView>
          <FlatList
            data={sheetData}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            style={{ flex: 1 }}
          />
        </ScrollView>
      )*/}
      {isLoading ? (
        <Animated.View style={[styles.loader, { transform: [{ rotate }] }]} />
      ) : // <ActivityIndicator size="large" color="#0000ff" />
      showText ? (
        <View style={{}}>
          <Text style={styles.dageshTextTitle}>דגשים לאקסל</Text>
          <Text style={styles.dageshText}>
            עמודה A - תאריך החשבונית - תאריך בתבנית קצרה שדה חובה
          </Text>
          <Text style={styles.dageshText}>עמודה B - שם הלקוח שדה חובה</Text>
          <Text style={styles.dageshText}>
            עמודה C - סוג האירוע - חתונה/צוות 1/צוות2/בר מצווה/אירוע
          </Text>
          <Text style={styles.dageshText}>עמודה D - מקום האירוע לא חובה</Text>
          <Text style={styles.dageshText}>
            עמודה E - להשאיר ריק - מידע של הלהקה
          </Text>
          <Text style={styles.dageshText}>עמודה F -כתובת לא חובה</Text>
          <Text style={styles.dageshText}>עמודה G -טלפון לא חובה</Text>
          <Text style={styles.dageshText}>
            עמודה H -מידע של להקה להשאיר ריק
          </Text>
          <Text style={styles.dageshText}>
            עמודה I -מידע של להקה להשאיר ריק
          </Text>
          <Text style={styles.dageshText}>עמודה J -סכום כולל מעמ שדה חובה</Text>
          <Text style={styles.dageshText}>
            עמודה K - כותרת השירות - אם ריק מופיע נגינה בחתונה בתאריך .../שירותי
            מוזיקה לחתונה
          </Text>
          <Text style={styles.dageshText}>
            עמודה L -שורת פריט - אם ריק כתוב נגינה בחתונה - 4.5 שעות/ שירותי
            מוזיקה
          </Text>
        </View>
      ) : null}

      {
        <ScrollView
          // horizontal={true}
          showsVerticalScrollIndicator={false}
          style={{ width: "100%" }}
        >
          {/*<View
            style={{
              flexdirection: "row",
              // backgroundColor: "rgba(0,0,0,0.1)",
            }}
          >*/}
          {sheetData
            ? sheetData.map((e, i) => {
                return (
                  <View key={i} style={{ flexDirection: "row" }}>
                    <ScrollView
                      horizontal
                      style={{
                        flexDirection: "row",
                        flex: 0.7,
                        // width: "20%",
                        //height: 50,
                        // alignItems: "center",
                        height: 50,
                        borderBottomWidth: 1,
                        borderColor: " grey",
                      }}
                    >
                      {e.map((cell, cellIndex) => {
                        if (cell >= 44000 && cell < 46000) {
                          const milliseconds = (cell - 25569) * 86400 * 1000;
                          const date = new Date(milliseconds);
                          setFormattedDate(
                            `${date.getDate()}/${
                              date.getMonth() + 1
                            }/${date.getFullYear()}`
                          );
                          // console.log("formattedDate:", formattedDate);
                        }

                        return (
                          <Text
                            key={cellIndex}
                            style={{
                              color: "black",
                              fontSize: 15,
                              writingDirection: "rtl",
                              marginHorizontal: 20,
                            }}
                          >
                            {cell > 44000 && cell < 46000
                              ? formattedDate
                              : cell}
                          </Text>
                        );
                      })}
                    </ScrollView>
                    {i > 1 ? (
                      documentSuccessArray[i] === false ? (
                        !isLoadingBtn[i] ? (
                          <TouchableOpacity
                            style={{
                              flex: 0.3,
                              alignItems: "center",
                              justifyContent: "center",
                              width: "30%",
                              fontSize: 25,
                              borderWidth: 1,
                              borderColor: "green",
                              // marginTop: 10,
                            }}
                            onPress={() => {
                              handleAddDocument(
                                convertDateFormat(sheetData[i][0]),
                                sheetData[i][1],
                                sheetData[i][2],
                                sheetData[i][6] ? sheetData[i][6] : "",
                                parseInt(sheetData[i][9]),
                                sheetData[i][10],
                                sheetData[i][11],
                                i
                              );
                            }}
                          >
                            <Text style={{ color: "blue" }}>הפק חשבונית</Text>
                          </TouchableOpacity>
                        ) : (
                          <View
                            style={{
                              flex: 0.3,
                              alignItems: "center",
                              justifyContent: "center",
                              width: "30%",
                              fontSize: 25,
                              borderWidth: 1,
                              borderColor: "green",
                              // marginTop: 10,
                            }}
                          >
                            {console.log("isLoadingBtn[i]:", isLoadingBtn[i])}
                            <ActivityIndicator size="small" color="#0000ff" />
                          </View>
                        )
                      ) : (
                        <View
                          style={{
                            flex: 0.3,
                            alignItems: "center",
                            justifyContent: "center",
                            width: "30%",
                            borderWidth: 1,
                            borderColor: "green",
                          }}
                        >
                          <Text style={{ color: "green" }}>הופק </Text>
                        </View>
                      )
                    ) : null}
                  </View>
                );
              })
            : null}
          {/*</View>*/}
        </ScrollView>
      }
    </View>
  );
}

export default App;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 30,
    backgroundColor: "#da000",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  cell: {
    flex: 1,
    padding: 5,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  headerCell: {
    flex: 1,
    padding: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f2f2f2",
    width: "auto",
  },
  rowContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  loader: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "red",
    //position: "absolute",
    // left: 200,
    // top: 0,
    alignSelf: "center",
    marginTop: 200,
    boxSizing: "border-box",
  },
  dageshTextTitle: {
    writingDirection: "rtl",
    fontSize: 20,
    alignSelf: "center",
    color: "#c5065e",
    marginTop: 20,
  },
  dageshText: {
    writingDirection: "rtl",
    fontSize: 15,
    marginHorizontal: 10,
    marginVertical: 2,
  },
});
