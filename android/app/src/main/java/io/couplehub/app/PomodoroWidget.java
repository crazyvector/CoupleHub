package io.couplehub.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONObject;

public class PomodoroWidget extends AppWidgetProvider {

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_pomodoro);

        SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        String pomodoroJson = prefs.getString("widget_pomodoro", "{}");

        String statusText = "Oprit";
        String timeText = "--:--";

        try {
            JSONObject state = new JSONObject(pomodoroJson);
            boolean isRunning = state.optBoolean("isRunning", false);
            String mode = state.optString("timerMode", "work");
            int remainingSeconds = state.optInt("remainingSeconds", 0);
            long targetEndTime = state.optLong("targetEndTime", 0);

            if (isRunning && targetEndTime > 0) {
                long now = System.currentTimeMillis();
                long diffSecs = (targetEndTime - now) / 1000;
                if (diffSecs > 0) {
                    remainingSeconds = (int) diffSecs;
                    statusText = mode.equals("work") ? "FOCUS" : "PAUZĂ";
                } else {
                    statusText = "Gata!";
                    remainingSeconds = 0;
                }
            } else if (!isRunning && remainingSeconds > 0) {
                statusText = "Pauză (Oprit)";
            }

            int m = remainingSeconds / 60;
            int s = remainingSeconds % 60;
            timeText = String.format("%02d:%02d", m, s);

        } catch (Exception e) {
            statusText = "Eroare";
        }

        views.setTextViewText(R.id.appwidget_status, statusText);
        views.setTextViewText(R.id.appwidget_time, timeText);

        Intent intent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("couplehub://app/study"));
        intent.setPackage(context.getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }
}
