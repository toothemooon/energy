import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Button, Image, StyleSheet, View } from "react-native";

type Props = {
  onPress?: (imageDataUrl: any) => void | Promise<unknown>;
};
export default function ImagePickerExample(prop: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  // Photo compress
  const compressImage = async (uri: string) => {
    if (!uri) return;
    try {
      const context = ImageManipulator.manipulate(uri);
      context.resize({
        width: 1024,
      });
      const renderedImage = await context.renderAsync();
      const result = await renderedImage.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.8,
      });

      // 读取纯 Base64 内容
      const file = new File(result.uri);
      const base64 = await file.base64();
      // 图片固定为 JPEG，拼接 Data URL
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      console.log("压缩完成:", result.uri);
      console.log("文件类型: image/jpeg");
      console.log("Base64 前缀:", dataUrl.slice(0, 30));
      console.log("Base64 长度:", base64.length);

      setImageUri(result.uri);
      setImageDataUrl(dataUrl);
    } catch (error) {
      console.error("图片压缩失败", error);
    }
  };

  // Pick image
  const pickImage = async () => {
    // No permissions request is necessary for launching the image library.
    // Manually request permissions for videos on iOS when `allowsEditing` is set to `false`
    // and `videoExportPreset` is `'Passthrough'` (the default), ideally before launching the picker
    // so the app users aren't surprised by a system dialog after picking a video.
    // See "Invoke permissions for videos" sub section for more details.
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Permission to access the media library is required.",
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImageUri(result.assets[0].uri); // 短暂看到原图
      compressImage(result.assets[0].uri);
    }
  };

  // Take Photo
  const takePhoto = async () => {
    // Camera access always requires the user's permission.
    // Taking a photo also requires a device with a camera. The iOS Simulator
    // does not have one, so use a physical device to test this button.
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Permission to access the camera is required.",
      );
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      compressImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Pick an image from camera roll" onPress={pickImage} />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      <Button title="Take a photo" onPress={takePhoto} />
      <Button
        title="test"
        onPress={() => {
          console.log("test 按钮被点击");
          console.log("当前 imageDataUrl 是否存在:", Boolean(imageDataUrl));
          if (imageUri) {
            console.log("调用 onPress...");
            if (prop.onPress !== undefined) {
              prop.onPress(imageDataUrl);
            }
          } else {
            console.log("imageDataUrl 为空，跳过");
          }
        }}
      ></Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 200,
    height: 200,
  },
});
