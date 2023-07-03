import {
  Button,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import * as SQLite from "expo-sqlite";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
const App = () => {
  var [db, setDb] = useState(SQLite.openDatabase("manage.db"));
  const [isloading, setIsloading] = useState(true);
  const [total, setTotal] = useState([]);
  const [currentTotal, setCurrentTotal] = useState(undefined);
  const exportDb = async () => {
    await Sharing.shareAsync(FileSystem.documentDirectory + "SQLite/manage.db");
  };
  const importDb = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });
    if (result.type === "success") {
      setIsloading(true);
      if (
        !(
          await FileSystem.getInfoAsync(FileSystem.documentDirectory + "SQLite")
        ).exists
      ) {
        await FileSystem.makeDirectoryAsync(
          FileSystem.documentDirectory + "SQLite"
        );

        const base64 = await FileSystem.readAsStringAsync(result.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await FileSystem.writeAsStringAsync(
          FileSystem.documentDirectory + "SQLite/manage.db",
          base64,
          { encoding: FileSystem.EncodingType.Base64 }
        );
        db.closeAsync();
        setDb(SQLite.openDatabase("manage.db"));
      }
    }
  };
  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS total(id INTEGER PRIMARY KEY AUTOINCREMENT,total TEXT,date TEXT)"
      );
      tx.executeSql(
        "SELECT * FROM total",
        null,
        (txObj, resultSet) => setTotal(resultSet.rows._array),
        (txObj, error) => console.log(error)
      );
    });
    setIsloading(false);
  }, []);

  if (isloading) {
    return (
      <View style={styles.container}>
        <Text>Loading Total....</Text>
      </View>
    );
  }
  const showTotal = () => {
    return total.map((tt, index) => {
      return (
        <View key={index} style={styles.forrow}>
          <Text>{tt.total}</Text>
          <Text>{tt.date}</Text>
          <Button title="Delete" onPress={() => deteteTotal(tt.id)} />
          <Button title="Update" onPress={() => updateTotal(tt.id)} />
        </View>
      );
    });
  };
  const addTotal = () => {
    const currentDate = new Date();
    const today = currentDate.toDateString();
    db.transaction((tx) => {
      tx.executeSql(
        "INSERT INTO total (total,date) VALUES (?,?)",
        [currentTotal, today],
        (txobj, resultSet) => {
          let existingTotals = [...total];
          existingTotals.push({
            id: resultSet.insertId,
            total: currentTotal,
            date: today,
          });
          setTotal(existingTotals);
          setCurrentTotal(undefined);
        },
        (txObj, error) => console.log(error)
      );
    });
  };

  const deteteTotal = (id) => {
    db.transaction((tx) => {
      tx.executeSql(
        "DELETE FROM total WHERE id=?",
        [id],
        (txObj, resultSet) => {
          console.log("Deleted");

          if (resultSet.rowsAffected > 0) {
            let existingTotals = [...total].filter((tot) => tot.id !== id);
            setTotal(existingTotals);
          }
        },
        (txObj, error) => {
          console.log(error);
        }
      );
    });
  };
  const updateTotal = (id) => {
    db.transaction((tx) => {
      tx.executeSql(
        "UPDATE total SET total = ? WHERE id =?",
        [currentTotal, id],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            let existingTotals = [...total];
            const uptodateTotal = existingTotals.findIndex(
              (total) => total.id == id
            );
            existingTotals[uptodateTotal].total = currentTotal;
            setTotal(existingTotals);
            setCurrentTotal(undefined);
          }
        },
        (txObj, error) => {
          console.log(error);
        }
      );
    });
  };
  return (
    <View style={styles.container}>
      <TextInput
        value={currentTotal}
        placeholder="Enter Total Amount"
        onChangeText={setCurrentTotal}
      />
      <Button title="Add Total" onPress={addTotal} />
      {showTotal()}
      <Button title="Export Data" onPress={exportDb} />
      <Button title="Import Data" onPress={importDb} />

      <StatusBar style="auto" />
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  forrow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "space-between",
    margin: 8,
  },
  button: {
    color: "red",
  },
});
